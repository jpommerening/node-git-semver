var fs = require('fs');
var path = require('path');
var findup = require('findup');
var async = require('async');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

/* the git bits */
var config = require('./config');
var reference = require('./reference');
var refs = require('./refs');
var versions = require('./versions');

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
 * Check if we know all we need to know of the repository and
 * emit an "end" event.
 */
function checkFinished(repo) {
  if (typeof repo.bare === 'undefined') {
    return false;
  }

  if (repo.gitdir && (repo.bare || repo.worktree)) {
    repo.emit('end');
    return true;
  } else {
    return false;
  }
}

/**
 * Listen for gitdir changes.
 */
function onGitdir(repo /*, options*/) {
  return function (dir) {
    if (dir !== repo.gitdir) {
      repo.gitdir = dir;

      /* check if the config specifies an alternate worktree */
      config({local: true, gitdir: dir}).on('entry', function (key, value) {
        if (key === 'core.worktree') {
          /* core.worktree is relative to the gitdir */
          repo.emit('worktree', path.join(dir, value));
        } else if (key === 'core.bare') {
          repo.emit('bare', value === 'true');
        }
      }).on('end', function () {
        checkFinished(repo);
      });
    }
  };
}

/**
 * Listen for .git files (pointers to gitdirs).
 */
function onGitfile(repo /*, options*/) {
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
function onWorktree(repo /*, options*/) {
  return function (dir) {
    var dotgit;
    if (dir !== repo.worktree) {
      repo.worktree = dir;

      checkFinished(repo);

      dotgit = dir + '/.git';

      if (dotgit === repo.gitdir) {
        return;
      }

      fs.stat(dotgit, function (err, stats) {
        if (err) {
          return repo.emit('error', err);
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
  };
}

/**
 * Bare repository?
 */
function onBare(repo /*, options*/) {
  return function (bare) {
    repo.bare = bare;

    checkFinished(repo);
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

  EventEmitter.apply(this);

  this.on('gitdir', onGitdir(this, options));
  this.on('gitfile', onGitfile(this, options));
  this.on('worktree', onWorktree(this, options));
  this.on('bare', onBare(this, options));

  utils.latchEvents(this, 'gitdir', 'worktree', 'bare');

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

inherits(Repository, EventEmitter);

Repository.prototype.config = function (cb) {
  return utils.pipeEvents.once(this, 'gitdir', config({local: true}, cb));
};

Repository.prototype.HEAD = function (cb) {
  return utils.pipeEvents.once(this, 'gitdir', reference('HEAD', cb));
};

Repository.prototype.refs = function () {
  return utils.pipeEvents.once(this, 'gitdir', refs.apply(null, arguments));
};

Repository.prototype.tags = function (cb) {
  return this.refs('refs/tags', cb);
};

Repository.prototype.heads = function (cb) {
  return this.refs('refs/heads', cb);
};

Repository.prototype.versions = function (/* [range], [cb] */) {
  return utils.pipeEvents.once(this, 'gitdir', versions.apply(null, arguments));
};

Repository.prototype.latest = function (/* [range], [cb] */) {
  return utils.pipeEvents.once(this, 'gitdir', versions.latest.apply(null, arguments));
};

var command = require('./command');
Repository.prototype.checkout = function (/* [reference], [options], [cb] */) {
  var args = [].slice.apply(arguments);
  var ref;
  var cb;
  if (typeof args[args.length-1] === 'function') {
    cb = args.pop();
  }
  if (args[0] && args[0] instanceof reference.Reference) {
    ref = args.shift();
  }

  var cmd = command(['gitdir', 'worktree', 'commit'], function (gitdir, worktree, commit, done) {
    done();
  }, cb);

  utils.pipeEvents.once(this, 'gitdir', 'worktree', cmd);

  if (ref) {
    ref.on('commit', cmd.emit.bind(cmd, 'commit'));
  } else {
    cmd.emit('commit', 'HEAD');
  }
  return this;
};

module.exports = utils.emitterFactory(Repository);
module.exports.Repository = Repository;
