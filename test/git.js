/*global describe, it*/

var expect = require('expect.js');
var path = require('path');

function collectStdout(childProcess, callback) {
  var buffer = '';

  childProcess.stdout.on('data', function (data) {
    buffer += data;
  });
  childProcess.stdout.on('end', function (data) {
    if (data) {
      buffer += data;
    }
    callback(buffer);
  });
}

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
      collectStdout(cp, function (stdout) {
        expect(stdout).to.contain('git version');
      });
      checkReturnCode(cp, done);
    });

    it('flattens object and array arguments', function (done) {
      var g = git();
      var cp = g.run({version: true});
      collectStdout(cp, function (stdout) {
        expect(stdout).to.contain('git version');
      });
      checkReturnCode(cp, done);
    });

    it('supplies config options if passed during creation', function (done) {
      var g = git({config: { 'test.test': true }});
      var cp = g.run('config', '--get', 'test.test');

      collectStdout(cp, function (stdout) {
        expect(stdout.trim()).to.be('true');
      });
      checkReturnCode(cp, done);
    });

    it('supplies .git dir if passed during creation', function (done) {
      var origin = fixtures.submodule.origin;
      var gitdir = fixtures.repository.gitdir;
      var g = git({gitdir: gitdir});
      var cp = g.run('config', '--get', 'submodule.submodule.url');

      collectStdout(cp, function (stdout) {
        expect(stdout.trim()).to.be(path.resolve(origin));
      });
      checkReturnCode(cp, done);
    });

    it('supplies work tree if passed during creation', function (done) {
      var worktree = fixtures.repository.worktree;
      var g = git({worktree: worktree});
      var cp = g.run('rev-parse', '--show-toplevel');

      collectStdout(cp, function (stdout) {
        expect(stdout.trim()).to.equal(path.resolve(worktree));
      });
      checkReturnCode(cp, done);
    });

  });

});
