var fs = require('fs');
var path = require('path');
var findup = require('findup');
var async = require('async');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

/* the git bits */
var config = require('./config');
var refs = require('./refs');

function isgitdir(dir, cb) {
  async.map([dir + '/refs', dir + '/HEAD'], fs.stat, function (err, stats) {
    if (err) {
      cb(false);
    } else {
      cb(stats[0].isDirectory() && stats[1].isFile());
    }
  });
}

/**
 * Resolve gitdir and worktree at a given directory.
 */
function resolveCwd(repo, cwd) {

  function checkdir(dir, cb) {
    isgitdir(dir, function (is) {
      if (is) {
        repo.emit('gitdir', dir);
        cb(true);
      } else {
        fs.exists(dir + '/.git', function (exists) {
          if (exists) {
            repo.emit('worktree', dir);
            cb(true);
          } else {
            cb(false);
          }
        });
      }
    });
  }

 findup(cwd, checkdir, function (err) {
    if (err) {
      repo.emit('error', err);
    }
  });
}

/**
 * Listen for gitdir changes.
 */
function onGitdir(repo, options) {
  return function (dir) {
    if (dir !== repo.gitdir) {
      /* todo: read config and determine if it is bare or
       * there is a worktree somewhere */
      repo.gitdir = dir;
    }
  };
}

/**
 * Listen for .git files (pointers to gitdirs).
 */
function onGitfile(repo, options) {
  var gitfile;
  return function (file) {
    if (file !== gitfile) {
      gitfile = file;

      fs.readFile(file, function (err, data) {
        if (err) {
          return repo.emit('error');
        }

        var prefix = data.toString('utf8', 0, 8);
        var dir = data.toString('utf8', 8);

        if (dir[dir.length-1] === '\n') {
          dir = dir.substr(0, dir.length-1);
        }

        if (prefix !== 'gitdir: ') {
          return repo.emit('error', new Error('Unexpected .git file content: ' + data));
        }

        repo.emit('gitdir', path.join(path.dirname(file), dir));
      });
    }
  };
}

/**
 * Listen for worktree changes.
 */
function onWorktree(repo, options) {
  return function (dir) {
    var dotgit;
    if (dir !== repo.worktree) {
      repo.worktree = dir;

      if (dir !== undefined) {
        dotgit = dir + '/.git';
        fs.stat(dotgit, function (err, stats) {
          if (err) {
            return;
          }

          if (stats.isDirectory()) {
            /* regular repo */
            repo.emit('gitdir', dotgit);
          } else {
            /* git submodule */
            repo.emit('gitfile', dotgit);
          }
        });
      }
    }
  };
}

function Repository(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { cwd: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Repository)) {
    return new Repository(options);
  }

  this.on('gitdir', onGitdir(this, options));
  this.on('gitfile', onGitfile(this, options));
  this.on('worktree', onWorktree(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
  if (options.worktree) {
    this.emit('worktree', options.worktree);
  }
  if (options.cwd || !(options.gitdir || options.worktree)) {
    resolveCwd(this, options.cwd || process.cwd());
  }
}

/**
 * Passes gitdir changes on the repository instance to
 * the given emitter.
 * If the gitdir is already set, emit it.
 * @returns the emitter
 */
function passThroughGitdir(repo, emitter) {
  var gitdir;

  function emit(dir) {
    if (dir && dir !== gitdir) {
      gitdir = dir;
      emitter.emit('gitdir', gitdir);
    }
  }

  repo.on('gitdir', emit);
  emit(repo.gitdir);
  return emitter;
}

inherits(Repository, EventEmitter);

Repository.prototype.config = function (cb) {
  return passThroughGitdir(this, config(cb));
};

Repository.prototype.tags = function (cb) {
  return passThroughGitdir(this, refs('refs/tags', cb));
};

Repository.prototype.heads = function (cb) {
  return passThroughGitdir(this, refs('refs/heads', cb));
};

module.exports = utils.emitterFactory(Repository, 'gitdir');
module.exports.Repository = Repository;
