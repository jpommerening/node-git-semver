/*global describe, it, beforeEach*/

var expect = require('expect.js');
var path = require('path');
var findup = require('findup');

describe('repository([path, [options,]] callback)', function () {

  'use strict';

  var repository = require('../lib/repository');

  it('returns a lazily populated Repository instance', function (done) {
    var repo = repository(done);
    expect(repo).to.be.a(repository.Repository);
    expect(repo.gitdir).to.be(undefined);
  });

  describe('when called with only a callback', function () {
    var worktree = path.dirname(__dirname);
    var gitdir = worktree + '/.git';
    var repo;

    beforeEach(function (done) {
      repo = repository(done);
    });

    it('creates a reference to the current Git repository', function () {
      expect(repo).to.be.a(repository.Repository);

      expect(repo.gitdir).to.equal(gitdir);
      expect(repo.worktree).to.equal(worktree);
    });

  });

  describe('when called with a path that points into a Git repository', function () {
    var worktree = path.dirname(__dirname);
    var gitdir = worktree + '/.git';
    var repo;

    beforeEach(function (done) {
      repo = repository(__dirname, done);
    });


    it('creates a reference to the Git repository pointed at', function () {
      expect(repo.gitdir).to.equal(gitdir);
      expect(repo.worktree).to.equal(worktree);
    });

  });

  describe('.config()', function () {
  });

  describe('.tags()', function () {
  });

  describe('.branches()', function () {
  });


});

