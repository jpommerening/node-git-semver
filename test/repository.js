/*global describe, it, beforeEach*/

var expect = require('expect.js');
var path = require('path');

describe('repository([path, [options,]] callback)', function () {

  'use strict';

  var fixtures = require('./fixtures');
  var repository = require('../lib/repository');

  it('returns a lazily populated Repository instance', function (done) {
    var repo = repository(done);
    expect(repo).to.be.a(repository.Repository);
    expect(repo.bare).to.be(undefined);
    expect(repo.gitdir).to.be(undefined);
    expect(repo.worktree).to.be(undefined);
  });

  describe('when called with only a callback', function () {
    var worktree = path.dirname(__dirname);
    var gitdir = worktree + '/.git';
    var repo;

    beforeEach(function (done) {
      repo = repository(done);
    });

    it('resolves the current repository\'s .git dir', function () {
      expect(repo.gitdir).to.equal(gitdir);
    });

    it('resolves the current repository\'s work tree', function () {
      expect(repo.worktree).to.equal(worktree);
    });

  });

  describe('when called with a path', function () {

    describe('for regular repositories', function () {
      var fixture = fixtures.repository;
      var repo;

      beforeEach(function (done) {
        repo = repository(fixture.worktree, done);
      });

      it('resolves the repository\'s .git dir', function () {
        expect(repo.gitdir).to.equal(fixture.gitdir);
      });

      it('resolves the repository\'s work tree', function () {
        expect(repo.worktree).to.equal(fixture.worktree);
      });
    });

    describe('for bare repositories', function () {
      var fixture = fixtures.bare;
      var repo;

      beforeEach(function (done) {
        repo = repository(fixture.gitdir, done);
      });

      it('resolves the repository\'s .git dir', function () {
        expect(repo.gitdir).to.equal(fixture.gitdir);
      });

      it('leaves repository\'s work tree undefined', function () {
        expect(repo.worktree).to.be(undefined);
      });
    });

    describe('for submodules', function () {
      var fixture = fixtures.submodule;
      var repo;

      beforeEach(function (done) {
        repo = repository(fixture.worktree, done);
      });

      it('resolves the repository\'s .git dir', function () {
        expect(repo.gitdir).to.equal(fixture.gitdir);
      });

      it('resolves the repository\'s work tree', function () {
        expect(repo.worktree).to.equal(fixture.worktree);
      });
    });

  });

  describe('.config()', function () {
  });

  describe('.tags()', function () {
  });

  describe('.branches()', function () {
  });


});
