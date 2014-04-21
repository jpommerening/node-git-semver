var expect = require('expect.js');
var path = require('path');

describe('config([options|file], [callback])', function () {

  'use strict';

  var fixtures = require('./fixtures');
  var config = require('../lib/config');

  it('returns a lazily populated Config instance', function (done) {
    var cfg = config(done);
    expect(cfg).to.be.a(config.Config);
    expect(cfg.core).to.be(undefined);
  });

  it('emits configuration entries as \'entry\' events', function (done) {
    var entry = {};
    config(function (err) {
      expect(entry.key).to.not.be(undefined);
      expect(entry.value).to.not.be(undefined);
      done(err);
    }).on('entry', function (key, value) {
      entry.key = key;
      entry.value = value;
    });
  });

  describe('when called with only a callback', function () {
    var cfg;

    beforeEach(function (done) {
      cfg = config(done);
    });

    it('uses the git default configuration', function () {
      /* flimsy test... */
      expect(cfg['core.bare']).to.be.ok();
    });
  });

  describe('when called with a path', function () {
    var cfg;

    beforeEach(function (done) {
      cfg = config(fixtures.repository.gitdir + '/config', done);
    });

    it('reads the config file that was passed in', function () {
      expect(cfg['core.bare']).to.equal('false');
      expect(cfg['submodule.submodule.url']).to.be.ok();
    });

    it('creates objects from dot-separated configuration entries', function () {
      expect(cfg.core.bare).to.be(false);
      expect(cfg.submodule.submodule.url).to.be(path.resolve(fixtures.submodule.origin));
    });

  });

});
