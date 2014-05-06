var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

/**
 * Load the config using the given git instance.
 * @returns an EventEmitter that emits one "entry"
 * event per config entry and "end" once it's finished.
 */
function loadConfig(g, options, emitter) {
  var childProcess = g.spawn('config', options, '--list');

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var eq = line.indexOf('=');
    var key = line.substr(0, eq);
    var value = line.substr(eq+1);

    emitter.emit('entry', key, value);
  });
  childProcess.stdout.on('end', function () {
    emitter.emit('end');
  });
  childProcess.on('error', function (err) {
    emitter.emit('error', err);
  });

  return emitter;
}

/**
 * Listen for gitdir changes and load the config using
 * the given options.
 */
function onGitdir(cfg, options) {
  var gitdir;
  var local = options.local;
  return function (dir) {
    if (dir !== gitdir) {
      gitdir = dir;
      loadConfig(git({gitdir: gitdir}), {local: local}, cfg);
    }
  };
}

/**
 * Listen for config entries and attach them to the instance.
 */
function onEntry(cfg /*, options*/) {
  return function (key, value) {
    cfg[key] = value;

    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }

    utils.objectInsert(cfg, key.split('.'), value);
  };
}

function Config(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = {file: options};
  } else {
    options = options || {};
  }

  if (!(this instanceof Config)) {
    return new Config(options);
  }

  EventEmitter.apply(this);

  this.on('gitdir', onGitdir(this, options));
  this.on('entry', onEntry(this, options));

  if (options.file) {
    loadConfig(git.shared(), {file: options.file}, this);
  } else if (options.global) {
    loadConfig(git.shared(), {global: true}, this);
  } else if (options.system) {
    loadConfig(git.shared(), {system: true}, this);
  } else if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  } else if (!options.local) {
    loadConfig(git.shared(), {}, this);
  }
}

inherits(Config, EventEmitter);

module.exports = utils.emitterFactory(Config);
module.exports.Config = Config;
