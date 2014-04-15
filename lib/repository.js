var fs = require('fs');
var path = require('path');
var findup = require('findup');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

function resolve(repo, cwd) {

  function gitdir(dir) {
    repo.gitdir = dir;
    repo.emit('gitdir', repo.gitdir);
  }

  function gitfile(file) {
    fs.readFile(file, repo.wrapcb(function (data) {
      var prefix = 'gitdir: ';
      if (data.substr(0, prefix.length) !== prefix) {
        return repo.emit('error', new Error('Unexpected .git file content: ' + data));
      }

      gitdir(path.relative(path.dirname(file), data.substr(prefix.length)));
    }));
  }

  function worktree(dir) {
    var dotgit = dir + '/.git';

    repo.worktree = dir;
    repo.emit('worktree', repo.worktree);

    fs.stat(dotgit, repo.wrapcb(function (stats) {
      if (stats.isDirectory()) {
        /* regular repo */
        gitdir(dotgit);
      } else {
        /* git submodule */
        gitfile(dotgit);
      }
    }));
  }

  if (repo.gitdir) {
    gitdir(repo.gitdir);
  } else if (repo.bare) {
    findup(cwd, 'config', repo.wrapcb(gitdir));
  } else {
    findup(cwd, '.git', repo.wrapcb(worktree));
  }
}

function Repository(options) {
  var cwd;

  if (typeof options === 'string' || options instanceof String) {
    cwd = options;
    options = arguments[1];
  } else {
    options = options || {};
    cwd = options.worktree || options.cwd || process.cwd();
  }

  this.bare = options.bare;
  this.gitdir = options.gitdir;
  this.worktree = options.worktree;

  this.refs = {};
  this.cache = {};

  var repo = this;
  resolve(repo, cwd);
  repo.on('gitdir', function () {
    repo.emit('end');
  });
}

inherits(Repository, EventEmitter);

/**
 * Wrap a the callback and return a node-style callback.
 * If an error occured, emit it on the repository.
 * Otherwise, call the provided callback with the remaining arguments.
 */
Repository.prototype.wrapcb = function wrapcb(callback) {
  var repo = this;

  return function (err) {
    if (err) {
      return repo.emit('error', err);
    }
    return callback.apply(this, [].slice.call(arguments, 1));
  };
};

/**
 * Get the configuration of the repository.
 */
Repository.prototype.config = function () {
};

function repository() {
  var callback = arguments[arguments.length - 1];
  var args = [].slice.call(arguments, arguments.length - 1);
  var repo = new Repository(args[0], args[1]);

  repo.on('end', function () {
    callback(null, repo);
  });
  repo.on('error', function (err) {
    callback(err);
  });

  return repo;
}
repository.Repository = Repository;

module.exports = repository;