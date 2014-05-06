var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var reference = require('./reference');
var git = require('./git');

/**
 * Load references using the given git instance and
 * filter.
 * @returns an EventEmitter that emits one "entry" event
 * per matching reference and "end" once it's finished.
 */
function loadRefs(g, filter, emitter) {
  var childProcess = g.spawn('show-ref');

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var commit = line.substr(0, 40);
    var path = line.substr(41);
    var name = filter(path);

    if (name) {
      var real = path.substr(5); /* 'refs/...' */
      emitter.emit('entry', reference({name: real, commit: commit}), name);
    }
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
 * Listen for gitdir changes and load references filtered
 * using the given options.
 */
function onGitdir(refs, options) {
  var gitdir;
  var filter = utils.makeFilter(options);
  return function (dir) {
    if (dir !== gitdir) {
      gitdir = dir;
      loadRefs(git({gitdir: gitdir}), filter, refs);
    }
  };
}

/**
 * Listen for refs and attach them to the instance.
 */
function onEntry(refs /*, options*/) {
  return function (ref, name) {
    refs[name] = ref.commit;
  };
}

function Refs(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = {path: options};
  } else {
    options = options || {};
  }

  if (!(this instanceof Refs)) {
    return new Refs(options);
  }

  EventEmitter.apply(this);

  this.on('gitdir', onGitdir(this, options));
  this.on('entry', onEntry(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Refs, EventEmitter);

module.exports = utils.emitterFactory(Refs);
module.exports.Refs = Refs;

