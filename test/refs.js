var expect = require('expect.js');

describe('refs([options|path], [callback])', function () {

  'use strict';

  var fixture = require('./fixtures').repository;

  var refs = require('../lib/refs');

  it('returns a lazily populated Refs instance', function (done) {
    var rfs = refs({gitdir: fixture.gitdir}, done);
    expect(rfs).to.be.a(refs.Refs);
    expect(rfs['refs/heads/master']).to.be(undefined);
  });

  it('emits found references entries as \'entry\' events', function (done) {
    var entry;
    refs({gitdir: fixture.gitdir}, function (err) {
      if (!err) {
        expect(entry.name).to.not.be(undefined);
        expect(entry.commit).to.not.be(undefined);
      }
      done(err);
    }).on('entry', function (e) {
      entry = e;
    });
  });

  describe('when called without an explicit .git dir', function () {
    it('waits for a \'gitdir\' event before reading refs', function (done) {
      var called = false;
      var rfs = refs(function (err) {
        if (!err) {
          expect(called).to.be(true);
        }
        done(err);
      }).on('entry', function () {
        called = true;
      });

      this.slow(200);

      setTimeout(function () {
        expect(called).to.be(false);
        rfs.emit('gitdir', fixture.gitdir);
      }, 70);
    });
  });

  describe('when called with only a callback', function () {
    it('reads all available refs as references', function (done) {
      refs(function (err, rfs) {
        if (!err) {
          for (var tag in fixture.tags) {
            expect(rfs['refs/tags/' + tag]).to.equal(fixture.tags[tag]);
          }
        }
        done(err);
      }).emit('gitdir', fixture.gitdir);
    });
  });

  describe('when called with a path', function () {

    it('reads the refs at the given path', function (done) {
      refs('refs/tags', function (err, rfs) {
        if (!err) {
          for (var tag in fixture.tags) {
            expect(rfs[tag]).to.equal(fixture.tags[tag]);
          }
        }
        done(err);
      }).emit('gitdir', fixture.gitdir);
    });
  });

});
