var fs = require('fs');
var path = require('path');
var findup = require('findup');
var async = require('async');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils')

function isgitdir(dir, cb) {
  var refs = false;
  var head = false;
  async.map([dir + '/refs', dir + '/HEAD'], fs.stat, function (err, stats) {
    if (err) {
      cb(false);
    } else {
      cb(stats[0].isDirectory() && stats[1].isFile());
    }
  });
}

function resolve(repo, cwd) {

  function gitdir(dir) {
    repo.gitdir = dir;
    repo.emit('gitdir', repo.gitdir);
  }

  function gitfile(file) {
    fs.readFile(file, repo.wrapcb(function (data) {
      var prefix = data.toString('utf8', 0, 8);
      var dir = data.toString('utf8', 8);

      if (dir[dir.length-1] === '\n') {
        dir = dir.substr(0, dir.length-1);
      }

      if (prefix !== 'gitdir: ') {
        return repo.emit('error', new Error('Unexpected .git file content: ' + data));
      }

      gitdir(path.join(path.dirname(file), dir));
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

  function checkdir(dir, cb) {
    isgitdir(dir, function (is) {
      if (is) {
        gitdir(dir);
        cb(true);
      } else {
        fs.exists(dir + '/.git', function (exists) {
          if (exists) {
            worktree(dir);
            cb(true);
          } else {
            cb(false);
          }
        });
      }
    });
  }

  if (repo.gitdir) {
    gitdir(repo.gitdir);
  } else {
    findup(cwd, checkdir, function (err, dir) {
      if (err) {
        repo.emit('error', err);
      }
    });
  }
}

function Repository(/* cwd, */ options) {
  var cwd;

  /* normalize arguments */
  if (typeof options === 'string' || options instanceof String) {
    cwd = options;
    options = arguments[1] || {};
  } else {
    options = options || {};
    cwd = options.worktree || process.cwd();
  }

  if (!(this instanceof Repository))
    return new Repository(cwd, options);

  this.bare = options.bare;
  this.gitdir = options.gitdir;
  this.worktree = options.worktree;

  this.refs = {};
  this.cache = {};

  var repo = this;
  resolve(repo, cwd);
  repo.once('gitdir', function () {
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

module.exports = utils.emitterFactory(Repository);
module.exports.Repository = Repository;
