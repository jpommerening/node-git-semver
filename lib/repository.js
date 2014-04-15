var fs = require('fs');
var path = require('path');
var findup = require('findup');
var async = require('async');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');
var config = require('./config');

function isgitdir(dir, cb) {
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
    fs.readFile(file, repo.wrapCallback(function (data) {
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

    fs.stat(dotgit, repo.wrapCallback(function (stats) {
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
    findup(cwd, checkdir, function (err) {
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

  if (!(this instanceof Repository)) {
    return new Repository(cwd, options);
  }

  this.bare = options.bare;
  this.gitdir = options.gitdir;
  this.worktree = options.worktree;

  this.git = options.git;
  this.cache = {};

  resolve(this, cwd);
}

inherits(Repository, EventEmitter);

Repository.prototype.ready = utils.latch('gitdir');
Repository.prototype.wrapCallback = utils.wrapCallback;

/**
 * Get the configuration of the repository.
 */
Repository.prototype.config = function () {
  return config({ file:  this.gitdir + '/config', git: this.git });
};

module.exports = utils.emitterFactory(Repository, 'gitdir');
module.exports.Repository = Repository;
