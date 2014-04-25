var expect = require('expect.js');
var path = require('path');
var fs = require('fs');
var utils = require('../lib/utils');

function checkReturnCode(childProcess, done) {
  childProcess.on('close', function (code) {
    expect(code).to.be(0);
    done();
  });
}

describe('git([options])', function () {

  'use strict';

  var git = require('../lib/git');
  var fixtures = require('./fixtures');

  it('returns a Git instance', function () {
    var g = git();
    expect(g).to.be.a(git.Git);
  });

  describe('.run([argument, ...])', function () {

    it('runs the git executable with the specified arguments', function (done) {
      var g = git();
      var cp = g.run('--version');
      utils.collectStream(cp.stdout, function (buffer) {
        var stdout = buffer.toString();
        expect(stdout).to.contain('git version');
      });
      checkReturnCode(cp, done);
    });

    it('flattens object and array arguments', function (done) {
      var g = git();
      var cp = g.run({version: true});
      utils.collectStream(cp.stdout, function (buffer) {
        var stdout = buffer.toString();
        expect(stdout).to.contain('git version');
      });
      checkReturnCode(cp, done);
    });

    it('supplies config options if passed during creation', function (done) {
      var g = git({config: { 'test.test': true }});
      var cp = g.run('config', '--get', 'test.test');

      utils.collectStream(cp.stdout, function (buffer) {
        var stdout = buffer.toString().trim();
        expect(stdout).to.equal('true');
      });
      checkReturnCode(cp, done);
    });

    it('supplies .git dir if passed during creation', function (done) {
      var origin = fixtures.submodule.origin;
      var gitdir = fixtures.repository.gitdir;
      var g = git({gitdir: gitdir});
      var cp = g.run('config', '--get', 'submodule.submodule.url');

      utils.collectStream(cp.stdout, function (buffer) {
        var stdout = buffer.toString().trim();
        expect(stdout).to.equal(path.resolve(origin));
      });
      checkReturnCode(cp, done);
    });

    it('supplies work tree if passed during creation', function (done) {
      var worktree = fixtures.repository.worktree;
      var g = git({worktree: worktree});
      var cp = g.run('rev-parse', '--show-toplevel');

      utils.collectStream(cp.stdout, function (buffer) {
        var stdout = buffer.toString().trim();
        expect(stdout).to.equal(path.resolve(worktree));
      });
      checkReturnCode(cp, done);
    });

  });

  describe('.checkout(revision, [args...], cb)', function () {

    var fixture;
    var g;

    beforeEach(function (done) {
      fixtures.temporary(function (err, tmp) {
        fixture = tmp;
        g = git({gitdir: fixture.gitdir, worktree: fixture.worktree});
        done(err);
      });
    });

    afterEach(function (done) {
      if (fixture) {
        fixture.remove(done);
      }
    });

    describe('when called with a revision and callback', function () {
      it('checks out the given revision from the repository into the work tree', function (done) {
        var commit = fixture.tags['v1.0.0'];
        g.checkout(commit, function (err) {
          if (!err) {
            var file = fs.readFileSync(fixture.worktree + '/file').toString().trim();
            expect(file).to.equal('1.0.0');
          }
          done(err);
        });
      });

      it('passes a result structure to the callback', function (done) {
        g.checkout('HEAD', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['checkout', 'HEAD']);
            expect(result.code).to.equal(0);
          }
          done(err);
        });
      });
    });

    describe('when called with more arguments', function () {
      it('passes them to git', function (done) {
        g.checkout('-b', 'test', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['checkout', '-b', 'test']);
          }
          done(err);
        });
      });
    });

    describe('when git returns an error', function () {
      it('passes an Error object to the callback', function (done) {
        g.checkout('-fail', function (err) {
          expect(err).to.be.an(Error);
          done();
        });
      });
    });

  });

  describe('.tag(name, [args...], cb)', function () {

    var fixture;
    var g;

    beforeEach(function (done) {
      fixtures.temporary(function (err, tmp) {
        fixture = tmp;
        g = git({gitdir: fixture.gitdir, worktree: fixture.worktree});
        done(err);
      });
    });

    afterEach(function (done) {
      if (fixture) {
        fixture.remove(done);
      }
    });

    describe('when called with a name and callback', function () {
      it('creates the given tag the current HEAD', function (done) {
        g.tag('test', function (err) {
          if (!err) {
            var file = fs.readFileSync(fixture.gitdir + '/refs/tags/test').toString().trim();
            expect(file).to.equal(fixture.HEAD);
          }
          done(err);
        });
      });

      it('passes a result structure to the callback', function (done) {
        g.tag('test', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['tag', 'test']);
            expect(result.code).to.equal(0);
          }
          done(err);
        });
      });
    });

    describe('when called with more arguments', function () {
      it('passes them to git', function (done) {
        g.tag('-a', 'test', '-m', 'test message', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['tag', '-a', 'test', '-m', 'test message']);
          }
          done(err);
        });
      });
    });

    describe('when git returns an error', function () {
      it('passes an Error object to the callback', function (done) {
        g.tag('-fail', function (err) {
          expect(err).to.be.an(Error);
          done();
        });
      });
    });

  });

  describe('.branch(name, [args...], cb)', function () {

    var fixture;
    var g;

    beforeEach(function (done) {
      fixtures.temporary(function (err, tmp) {
        fixture = tmp;
        g = git({gitdir: fixture.gitdir, worktree: fixture.worktree});
        done(err);
      });
    });

    afterEach(function (done) {
      if (fixture) {
        fixture.remove(done);
      }
    });

    describe('when called with a name and callback', function () {
      it('creates the given branch the current HEAD', function (done) {
        g.branch('test', function (err) {
          if (!err) {
            var file = fs.readFileSync(fixture.gitdir + '/refs/heads/test').toString().trim();
            expect(file).to.equal(fixture.HEAD);
          }
          done(err);
        });
      });

      it('passes a result structure to the callback', function (done) {
        g.branch('test', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['branch', 'test']);
            expect(result.code).to.equal(0);
          }
          done(err);
        });
      });
    });

    describe('when called with more arguments', function () {
      it('passes them to git', function (done) {
        g.branch('test', 'v1.0.0', function (err, result) {
          if (!err) {
            expect(result.args).to.eql(['branch', 'test', 'v1.0.0']);
          }
          done(err);
        });
      });
    });

    describe('when git returns an error', function () {
      it('passes an Error object to the callback', function (done) {
        g.branch('-fail', function (err) {
          expect(err).to.be.an(Error);
          done();
        });
      });
    });

  });

});
