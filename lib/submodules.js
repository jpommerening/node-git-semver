var minimatch = require('minimatch');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

function parseGitmodules(g, blob, filter, emitter) {
  var childProcess = g.run('config', {blob: blob, list: true});

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var match = /^submodule.([^=]|\\=)+.path=(.*)$/.exec(line);
    var path = match && filter(match[2]);

    if (path) {
      emitter.emit('entry', path);
    }
  });
  childProcess.stdout.on('end', function () {
    emitter.emit('end'); /* no .gitmodules */
  });
  childProcess.on('error', function (err) {
    emitter.emit('error', err);
  });

  return emitter;
}

function loadModules(g, commit, filter, emitter) {
  var childProcess = g.run('ls-tree', commit);
  var blob;

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var match = /^100644 blob ([0-9a-f]+)\t\.gitmodules$/.exec(line);

    if (match) {
      blob = match[1];
    }
  });
  childProcess.stdout.on('end', function () {
    if (!blob) {
      emitter.emit('end'); /* no .gitmodules */
    } else {
      parseGitmodules(g, blob, filter, emitter);
    }
  });
  childProcess.on('error', function (err) {
    emitter.emit('error', err);
  });

  return emitter;
}

function onGitdir(modules, options) {
  var filter = utils.makeFilter(options);
  return function (gitdir) {
    modules.gitdir = gitdir;
    if (modules.gitdir && modules.commit) {
      loadModules(git({gitdir: modules.gitdir}), modules.commit, filter, modules);
    }
  };
}

function onCommit(modules, options) {
  var filter = utils.makeFilter(options);
  return function (commit) {
    modules.commit = commit;
    if (modules.gitdir && modules.commit) {
      loadModules(git({gitdir: modules.gitdir}), modules.commit, filter, modules);
    }
  };
}

function onEntry(modules /*, options*/) {
  return function (path) {
    modules[path] = true;
  };
}

function Submodules(options) {
  if (typeof options === 'string' || options instanceof String) {
    if (/[*+!?]/.test(options)) {
      options = {pattern: options};
    } else {
      options = {path: options};
    }
  } else {
    options = options || {};
  }

  if (!(this instanceof Submodules)) {
    return new Submodules(options);
  }

  if (options.pattern && !options.filter) {
    options.filter = minimatch.filter(options.pattern);
  }

  EventEmitter.apply(this);

  this.on('gitdir', onGitdir(this, options));
  this.on('commit', onCommit(this, options));
  this.on('entry', onEntry(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
  if (options.commit) {
    this.emit('commit', options.commit);
  }
}

inherits(Submodules, EventEmitter);

module.exports = utils.emitterFactory(Submodules);
module.exports.Submodules = Submodules;

