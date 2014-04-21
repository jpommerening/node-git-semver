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

  describe('.checkout(revision, cb)', function () {

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
          var file = fs.readFileSync(fixture.worktree + '/file').toString().trim();
          expect(file).to.equal('1.0.0');
          done(err);
        });
      });

    });

  });

});
