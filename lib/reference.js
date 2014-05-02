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
      if (options.commit) {
        ref.emit('commit', options.commit);
        ref.emit('end');
      } else if (ref.commit) {
        ref.emit('end');
      } else {
        loadReference(git({gitdir: gitdir}), options.name || 'HEAD', ref);
      }
    }
  };
}

function onCommit(ref /*, options*/) {
  return function (commit) {
    ref.commit = commit;
    if (!ref.name) {
      ref.name = commit;
    }
  };
}

function Reference(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { name: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Reference)) {
    return new Reference(options);
  }

  EventEmitter.apply(this);

  this.name = options.name;

  this.on('gitdir', onGitdir(this, options));
  this.on('commit', onCommit(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Reference, EventEmitter);

Reference.prototype.checkout = function checkout(worktree, cb) {
  git({worktree: worktree}).checkout(this.commit, cb);
};

module.exports = utils.emitterFactory(Reference);
module.exports.Reference = Reference;
