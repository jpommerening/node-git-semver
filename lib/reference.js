var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

/**
 *
 */
function loadReference(g, name, emitter) {
  var childProcess = g.spawn('rev-parse', name);

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
    options = {name: options};
  } else {
    options = options || {};
  }

  if (!(this instanceof Reference)) {
    return new Reference(options);
  }

  EventEmitter.apply(this);

  this.name = options.name;
  this.commit = options.commit;

  this.on('gitdir', onGitdir(this, options));
  this.on('commit', onCommit(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Reference, EventEmitter);

var command = require('./command');

Reference.prototype.checkout = function checkout(worktree, cb) {
  var cmd = command(['gitdir', 'worktree', 'commit'], function (gitdir, worktree, commit, done) {
    git({gitdir: gitdir, worktree: worktree}).checkout(commit, done);
  }, cb);

  utils.pipeEvents.once(this, 'gitdir', 'commit', cmd);
  cmd.emit('worktree', worktree);
  return this;
};

module.exports = utils.emitterFactory(Reference);
module.exports.Reference = Reference;
