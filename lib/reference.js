var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

/**
 *
 */
function loadReference(g, name, emitter) {
  var childProcess = g.run('rev-parse', name);

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.once('line', function (line) {
    emitter.emit('commit', line);
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
 * Listen for gitdir changes and load the reference.
 */
function onGitdir(ref, options) {
  var gitdir;
  return function (dir) {
    if (dir !== gitdir) {
      gitdir = dir;
      loadReference(git({gitdir: gitdir}), 'HEAD', ref);
    }
  };
}

function onCommit(ref, options) {
  return function (commit) {
    ref.commit = commit;
  };
}

function Reference(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { commit: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Reference)) {
    return new Reference(options);
  }

  this.on('gitdir', onGitdir(this, options));
  this.on('commit', onCommit(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Reference, EventEmitter);

module.exports = utils.emitterFactory(Reference);
module.exports.Reference = Reference;
