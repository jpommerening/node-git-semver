var expect = require('expect.js');

describe('submodules([options|pattern], [callback])', function () {

  'use strict';

  var fixture = require('./fixtures').repository;

  var submodules = require('../lib/submodules');

  it('returns a lazily populated Submodules instance', function (done) {
    var modules = submodules({gitdir: fixture.gitdir, commit: 'HEAD'}, done);
    expect(modules).to.be.a(submodules.Submodules);
    expect(modules['submodule']).to.be(undefined);
  });

  it('emits found submodules as \'entry\' events', function (done) {
    var entry = {};
    submodules({gitdir: fixture.gitdir, commit: 'HEAD'}, function (err) {
      if (!err) {
        expect(entry).to.not.be(undefined);
      }
      done(err);
    }).on('entry', function (path) {
      entry = path;
    });
  });

});
