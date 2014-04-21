var expect = require('expect.js');

describe('reference([options|commit], [callback])', function () {

  'use strict';

  var fixtures = require('./fixtures');
  var reference = require('../lib/reference');

  it('returns a lazily populated Reference instance', function () {
    var ref = reference();
    expect(ref).to.be.a(reference.Reference);
    expect(ref.commit).to.be(undefined);
  });

  describe('when called without an explicit .git dir', function () {
    it('waits for a \'gitdir\' event before reading a ref', function (done) {
      var ref = reference(done);

      this.slow(200);

      setTimeout(function () {
        expect(ref.commit).to.be(undefined);
        ref.emit('gitdir', fixtures.repository.gitdir);
      }, 70);
    });
  });

  describe('when called with only a callback', function () {
    it('reads the repository\'s HEAD reference', function (done) {
      var ref = reference(function (err) {
        expect(ref.commit).to.equal(fixtures.repository.HEAD);
        done(err);
      });
      ref.emit('gitdir', fixtures.repository.gitdir);
    });
  });

  describe('.checkout(worktree, [callback])', function () {
    it('checks out the reference in the given worktree');
    it('returns a Reference instance');
  });

  describe('.tag([name|options], [callback])', function () {
    it('creates a new tag pointing to the commit');
    it('returns a Reference instance');
  });

  describe('.branch([name|options], [callback])', function () {
    it('creates a new branch pointing to the commit');
    it('returns a Reference instance');
  });

});
