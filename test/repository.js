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

      it('sets repository\'s bare property to false', function () {
        expect(repo.bare).to.be(false);
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

      it('sets repository\'s bare property to true', function () {
        expect(repo.bare).to.be(true);
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

      it('sets repository\'s bare property to false', function () {
        expect(repo.bare).to.be(false);
      });
    });

    describe('for a submodules\' .git dir', function () {
      var fixture = fixtures.submodule;
      var repo;

      beforeEach(function (done) {
        repo = repository(fixture.gitdir, done);
      });

      it('resolves the repository\'s .git dir', function () {
        expect(repo.gitdir).to.equal(fixture.gitdir);
      });

      it('resolves the repository\'s work tree', function () {
        expect(repo.worktree).to.equal(fixture.worktree);
      });

      it('sets repository\'s bare property to false', function () {
        expect(repo.bare).to.be(false);
      });
    });
  });

  describe('.config([callback])', function () {
    var fixture = fixtures.repository;
    var key = 'submodule.submodule.url';
    var value = path.resolve(fixtures.submodule.origin);
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
        expect(cfg[key]).to.equal(value);
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var cfg = repository(fixture.worktree).config(function (err, cfg) {
        expect(cfg[key]).to.equal(value);
        done(err);
      });
      expect(cfg[key]).to.be(undefined);
    });
  });

  describe('.tags([callback])', function () {
    var fixture = fixtures.repository;
    var tag = '1.0.0';
    var commit = fixture.meta.tags[tag];
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
        expect(tags[tag]).to.equal(commit);
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var tags = repository(fixture.worktree).tags(function (err, tags) {
        expect(tags[tag]).to.equal(commit);
        done(err);
      });
      expect(tags[tag]).to.be(undefined);
    });
  });

  describe('.heads([callback])', function () {
    var fixture = fixtures.repository;
    var head = 'master';
    var commit = /[0-9a-f]{40}/;
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
        expect(heads[head]).to.match(commit);
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var heads = repository(fixture.worktree).heads(function (err, heads) {
        expect(heads[head]).to.match(commit);
        done(err);
      });
      expect(heads[head]).to.be(undefined);
    });
  });

  describe('.versions([range], [callback])', function () {
    var fixture = fixtures.repository;
    var tags = fixture.meta.tags;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Versions instance');

    it('populates the returned Versions instance with semantic versions', function (done) {
      repo.versions(function (err, versions) {
        for (var tag in tags) {
          expect(versions[tag]).to.equal(tags[tag]);
        }
        done(err);
      });
    });

    it('filters according to semantic version ranges', function (done) {
      repo.versions('<1.0.0', function (err, versions) {
        /* TODO: remove "v" */
        expect(versions['v0.1.0']).to.not.be(undefined);
        expect(versions['v1.0.0']).to.be(undefined);
        done(err);
      });
    });
  });

});
