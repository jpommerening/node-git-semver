var expect = require('expect.js');
var path = require('path');
var semver = require('semver');

describe('repository([options|cwd], [callback])', function () {

  'use strict';

  var fixtures = require('./fixtures');
  var repository = require('../lib/repository');
  var reference = require('../lib/reference');
  var config = require('../lib/config');
  var refs = require('../lib/refs');
  var versions = require('../lib/versions');

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

    it('returns a Config instance', function (done) {
      var cfg = repo.config(done);
      expect(cfg).to.be.a(config.Config);
    });

    it('populates the returned Config instance with configuration entries', function (done) {
      repo.config(function (err, cfg) {
        if (!err) {
          expect(cfg[key]).to.equal(value);
        }
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var cfg = repository(fixture.worktree).config(function (err, cfg) {
        if (!err) {
          expect(cfg[key]).to.equal(value);
        }
        done(err);
      });
      expect(cfg[key]).to.be(undefined);
    });
  });

  describe('.HEAD([callback])', function () {
    var fixture = fixtures.repository;
    var commit = fixture.HEAD;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Reference instance', function (done) {
      var ref = repo.HEAD(done);
      expect(ref).to.be.a(reference.Reference);
    });

    it('points the returned Reference instance to the repository\'s HEAD', function (done) {
      repo.HEAD(function (err, ref) {
        if (!err) {
          expect(ref.commit).to.equal(commit);
        }
        done(err);
      });
    });
  });

  describe('.tags([callback])', function () {
    var fixture = fixtures.repository;
    var tag = '1.0.0';
    var commit = fixture.tags[tag];
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Refs instance', function (done) {
      var tags = repo.tags(done);
      expect(tags).to.be.a(refs.Refs);
    });

    it('populates the returned Refs instance with the repository\'s tags', function (done) {
      repo.tags(function (err, tags) {
        if (!err) {
          expect(tags[tag]).to.equal(commit);
        }
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var tags = repository(fixture.worktree).tags(function (err, tags) {
        if (!err) {
          expect(tags[tag]).to.equal(commit);
        }
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

    it('returns a Refs instance', function (done) {
      var heads = repo.heads(done);
      expect(heads).to.be.a(refs.Refs);
    });

    it('populates the returned Refs instance with the repository\'s branches', function (done) {
      repo.heads(function (err, heads) {
        if (!err) {
          expect(heads[head]).to.match(commit);
        }
        done(err);
      });
    });

    it('can be called before the repository is initialized', function (done) {
      var heads = repository(fixture.worktree).heads(function (err, heads) {
        if (!err) {
          expect(heads[head]).to.match(commit);
        }
        done(err);
      });
      expect(heads[head]).to.be(undefined);
    });
  });

  describe('.versions([range], [callback])', function () {
    var fixture = fixtures.repository;
    var tags = fixture.tags;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Versions instance', function (done) {
      var vrs = repo.versions(done);
      expect(vrs).to.be.a(versions.Versions);
    });

    it('populates the returned Versions instance with semantic versions', function (done) {
      repo.versions(function (err, versions) {
        if (!err) {
          for (var tag in tags) {
            var parsed = semver.parse(tag);
            var v = parsed.version + (parsed.build.length ? '+' + parsed.build.join('.') : '');
            expect(versions[v]).to.equal(tags[tag]);
          }
        }
        done(err);
      });
    });

    it('filters according to semantic version ranges', function (done) {
      repo.versions('<1.0.0', function (err, versions) {
        if (!err) {
          expect(versions['0.1.0']).to.not.be(undefined);
          expect(versions['1.0.0']).to.be(undefined);
        }
        done(err);
      });
    });
  });

  describe('.latest([range], [callback])', function () {
    var fixture = fixtures.repository;
    var tags = fixture.tags;
    var repo;

    beforeEach(function (done) {
      repo = repository(fixture.worktree, done);
    });

    it('returns a Reference instance', function (done) {
      var ref = repo.latest(done);
      expect(ref).to.be.a(reference.Reference);
    });

    it('points the returned Reference instance to the latest version matching the given range', function (done) {
      repo.latest('0.x', function (err, ref) {
        if (!err) {
          expect(ref.commit).to.equal(tags['v0.2.1']);
        }
        done(err);
      });
    });
  });

});
