var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

/**
 * Load references using the given git instance and
 * filter.
 * @returns an EventEmitter that emits one "entry" event
 * per matching reference and "end" once it's finished.
 */
function loadRefs(g, filter, emitter) {
  var childProcess = g.run('show-ref');

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var commit = line.substr(0, 40);
    var ref = line.substr(41);
    var name = filter(ref);

    if (name) {
      emitter.emit('entry', name, commit);
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
 * Build a ref filter from the given options.
 * If the options object contains a "path" property, only references
 * at the given path will be listed.
 * If the options object contains a "filter" property and it is either
 * a function or an object with a "test" method, it will be used to
 * further filter the refs.
 * @returns a function that returns either the matching reference name
 * or false if the reference did not match.
 */
function makeFilter(options) {
  var path = options.path;
  var filter = options.filter;
  var test;

  if (typeof filter === 'object' && typeof filter.test === 'function') {
    test = filter.test.bind(filter);
  } else if (typeof filter === 'function') {
    test = filter;
  } else {
    test = function() { return true; };
  }

  if (path) {
    if (path[path.length-1] !== '/') {
      path = path+'/';
    }

    return function (ref) {
      var name;
      if (ref.substr(0, path.length) === path) {
        name = ref.substr(path.length);
        return test(name) && name;
      }
    };
  } else {
    return function (ref) {
      return test(ref) && ref;
    };
  }
}

/**
 * Listen for gitdir changes and load references filtered
 * using the given options.
 */
function onGitdir(refs, options) {
  var gitdir;
  var filter = makeFilter(options);
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
function onEntry(refs, options) {
  return function (name, commit) {
    refs[name] = commit;
  };
}

function Refs(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { path: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Refs)) {
    return new Refs(options);
  }

  this.on('gitdir', onGitdir(this, options));
  this.on('entry', onEntry(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Refs, EventEmitter);

Refs.prototype.ready = utils.latch('end');
Refs.prototype.wrapCallback = utils.wrapCallback;

module.exports = utils.emitterFactory(Refs);
module.exports.Refs = Refs;

