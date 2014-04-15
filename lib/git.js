var which = require('which');
var util = require('util');
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
  return Object.keys(object).map(function (key) {
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
    if (util.isArray(arg)) {
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
  var args = config.concat(normalizeArgs.apply(null, arguments));
  return spawn(this.cmd, args);
};

function git(options) {
  return new Git(options);
}

git.Git = Git;
git.shared = function shared() {
  return git.shared.instance = git.shared.instance || git();
};

module.exports = git;
