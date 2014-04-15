var which = require('which');
var util = require('util');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

function Git(options) {
  if (typeof options === 'string' || options instanceof String) {
    this.cmd = options;
    options = arguments[1];
  } else {
    options = options || {};
    this.cmd = options.cmd || which.sync('git');
  }

  this.version = undefined;
  this.config = options.config || {};
}

inherits(Git, EventEmitter);

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
    if (arg instanceof Object) {
      return command.concat(flattenOptions(arg));
    } else if (util.isArray(arg)) {
      return command.concat(arg);
    } else {
      return command.concat([arg]);
    }
  }, []);
}

Git.prototype.run = function run(command) {
  var config = flattenConfig(this.config);
  var args = config.concat(normalizeArgs.apply(null, arguments));

  var child = spawn(this.cmd, args);
  child.on('error', this.emit.bind(this, 'error'));
  return child;
}

function git(options, callback) {
  return new Git(options);
}
git.Git = Git;

module.exports = git;
