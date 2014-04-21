var which = require('which');
var isArray = require('util').isArray;
var inherits = require('util').inherits;
var utils = require('./utils');
var spawn = require('child_process').spawn;

function Git(options) {
  var cmd;

  if (typeof options === 'string' || options instanceof String) {
    cmd = options;
    options = arguments[1];
  } else {
    options = options || {};
    cmd = options.cmd || which.sync('git');
  }

  if (!(this instanceof Git)) {
    return new Git(cmd, options);
  }

  this.cmd = cmd;
  this.gitdir = options.gitdir;
  this.worktree = options.worktree;
  this.version = undefined;
  this.config = options.config || {};
}

function flattenConfig(object) {
  return Object.keys(object).reduce(function (command, key) {
    var value = object[key];
    return command.concat(['-c', key + '=' + value]);
  }, []);
}

function flattenOptions(object) {
  return Object.keys(object).filter(function (key) {
    return object[key] !== undefined;
  }).map(function (key) {
    var value = object[key];
    if (value === true) {
      return '--' + key;
    } else if (value === false) {
      return '--no-' + key;
    } else {
      return '--' + key + '=' + value;
    }
  });
}

function normalizeArgs() {
  return [].reduce.call(arguments, function (command, arg) {
    if (isArray(arg)) {
      return command.concat(arg);
    } else if (arg instanceof Object) {
      return command.concat(flattenOptions(arg));
    } else {
      return command.concat([arg]);
    }
  }, []);
}

Git.prototype.run = function run() {
  var config = flattenConfig(this.config);
  var args = normalizeArgs.apply(null, arguments);

  if (this.gitdir) {
    config.push('--git-dir=' + this.gitdir);
  }
  if (this.worktree) {
    config.push('--work-tree=' + this.worktree);
  }

  /*
  console.log(this.cmd, config, args);
  */

  return spawn(this.cmd, config.concat(args));
};

function GitError(message) {
  Error.call(this, message);
}
inherits(GitError, Error);

function command(git, args, cb) {
  var childProcess = git.run(args);
  var stderr;
  var stdout;

  utils.collectStream(childProcess.stderr, function (buffer) {
    stderr = buffer.toString()
  });

  utils.collectStream(childProcess.stdout, function (buffer) {
    stdout = buffer.toString()
  });

  childProcess.on('error', cb);
  childProcess.on('close', function (code) {
    if (code !== 0) {
      cb(new GitError('Failed to run `git ' + args.join(' ') + '`: ' + code, {
        gitdir: git.gitdir,
        worktree: git.worktree,
        config: git.config,
        args: args,
        stderr: stderr,
        stdout: stdout
      }));
    } else {
      cb();
    }
    stderr = null;
    stdout = null;
  });

  return childProcess;
}

Git.prototype.checkout = function checkout(revision, cb) {
  var args = ['checkout', revision || 'HEAD'];
  return command(this, args, cb);
};

Git.prototype.tag = function tag(name, cb) {
  var args = ['tag', name];
  return command(this, args, cb);
};

Git.prototype.branch = function branch(name, cb) {
  var args = ['branch', name];
  return command(this, args, cb);
};

function git(options) {
  return new Git(options);
}

git.Git = Git;
git.shared = function shared() {
  return git.shared.instance = git.shared.instance || git();
};
git.checkout = function (revision, options, cb) {
  return git(options).checkout(revision, cb);
};

module.exports = git;
