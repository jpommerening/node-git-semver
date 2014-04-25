var which = require('which');
var isArray = require('util').isArray;
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

function createError(message, data) {
  var err = new Error(message);

  for (var name in data) {
    if (data.hasOwnProperty(name)) {
      err[name] = data[name];
    }
  }

  return err;
}

/**
 * Generate a method to run (named) git commands.
 * Any arguments that are passed in will be prepended to
 * the arguments taken by the method.
 */
function command(/*arg1, arg2, ..., argN*/) {
  var partial = [].slice.apply(arguments);
  return function (/*argN+1, argN+2, ..., argN+M, [callback]*/) {
    var callback;
    var args = [].concat(partial, [].slice.apply(arguments));

    /* peel off callback */
    if (typeof args[args.length-1] === 'function') {
      callback = args.pop();
    }

    var childProcess = this.run(args);
    var result = {
      gitdir: this.gitdir,
      worktree: this.worktree,
      config: this.config,
      args: args
    };


    if (callback) {
      utils.collectStream(childProcess.stderr, function (buffer) {
        result.stderr = buffer.toString();
      });

      utils.collectStream(childProcess.stdout, function (buffer) {
        result.stdout = buffer.toString();
      });

      childProcess.on('error', callback);
      childProcess.on('close', function (code) {
        result.code = code;

        if (code !== 0) {
          callback(createError('Failed to run `git ' + args.join(' ') + '`: ' + code, result));
        } else {
          callback(null, result);
        }
      });
    }

    return childProcess;
  };
}

Git.prototype.checkout = command('checkout');
Git.prototype.tag = command('tag');
Git.prototype.branch = command('branch');

function git(options) {
  return new Git(options);
}

git.Git = Git;
git.shared = function shared() {
  return git.shared.instance = git.shared.instance || git();
};

module.exports = git;
