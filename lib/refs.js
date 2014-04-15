var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

function load(refs, g, filter) {
  var args = [ 'show-ref' ];

  var childProcess = g.run(args);

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var commit = line.substr(0, 40);
    var ref = line.substr(41);

    var name = filter(ref);
    if (name) {
      refs[name] = commit;
      refs.emit('entry', name, commit);
    }
  });
  childProcess.stdout.on('end', function () {
    refs.emit('end');
  });
  childProcess.once('error', function (err) {
    refs.emit('error', err);
  });
}

function makeFilter(path, filter) {
  var test;

  if (filter instanceof RegExp) {
    test = filter.test.bind(filter);
  } else if (typeof filter === 'function') {
    test = filter;
  } else if (typeof filter === 'undefined') {
    test = function() { return true; };
  } else {
    test = function() { return test.indexOf(filter) >= 0; };
  }

  if (path) {
    if (path[path.length-1] !== '/') {
      path = path+'/';
    }

    return function (ref) {
      var name;
      if (ref.substr(0, path.length) === path) {
        name = path.substr(path.length);
        return test(name) && name;
      }
    };
  } else {
    return function (ref) {
      return test(ref) && ref;
    };
  }
}

function Refs(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { path: options };
  } else if (typeof options === 'function') {
    options = { filter: options };
  } else if (options instanceof RegExp) {
    options = { filter: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Refs)) {
    return new Refs(options);
  }

  load(this, options.git || git.shared(), makeFilter(options.path, options.filter));
}

inherits(Refs, EventEmitter);

Refs.prototype.ready = utils.latch('end');
Refs.prototype.wrapCallback = utils.wrapCallback;

module.exports = utils.emitterFactory(Refs);
module.exports.Refs = Refs;

