/*global describe, it, beforeEach*/

var expect = require('expect.js');
var path = require('path');

describe('repository([options|cwd], [callback])', function () {

  'use strict';

  var fixtures = require('./fixtures');
  fixtures.repository.meta = require('./fixtures/repository');
  var repository = require('../lib/repository');
  var config = require('../lib/config');
  var refs = require('../lib/refs');

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

  describe('.config([callback])', function () {
    var fixture = fixtures.repository;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Config instance', function () {
      var cfg = repo.config();
      expect(cfg).to.be.a(config.Config);
    });

    it('populates the returned Config instance with configuration entries', function (done) {
      repo.config(function (err, cfg) {
        expect(cfg.submodule.submodule.url).to.equal(path.resolve(fixtures.submodule.origin));
        done();
      });
    });

  });

  describe('.tags([callback])', function () {
    var fixture = fixtures.repository;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Refs instance', function () {
      var tags = repo.tags();
      expect(tags).to.be.a(refs.Refs);
    });

    it('populates the returned Refs instance with the repository\'s tags', function (done) {
      repo.tags(function (err, tags) {
        for (var tag in fixture.meta.tags) {
          expect(tags[tag]).to.equal(fixture.meta.tags[tag]);
        }
        done();
      });
    });

  });

  describe('.heads([callback])', function () {
    var fixture = fixtures.repository;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Refs instance', function () {
      var heads = repo.heads();
      expect(heads).to.be.a(refs.Refs);
    });

    it('populates the returned Refs instance with the repository\'s branches', function (done) {
      repo.heads(function (err, heads) {
        expect(heads.master).to.match(/[0-9a-f]{40}/);
        done();
      });
    });

  });

});
