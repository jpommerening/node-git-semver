var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

function load(refs, g, path) {
  var args = [ 'show-ref' ];

  var childProcess = g.run(args);

  if (path[path.length-1] !== '/') {
    path += '/';
  }

  utils.emitLines(childProcess.stdout);

  var all = {};

  childProcess.stdout.on('line', function (line) {
    var commit = line.substr(0, 40);
    var ref = line.substr(41);
    if (ref.substr(0, path.length) === path) {
      var name = ref.substr(path.length);
      refs[name] = commit;
      all[name] = commit;
      refs.emit('ref', name, commit);
    }
  });
  childProcess.once('close', function () {
    refs.emit('refs', all);
  });
  childProcess.once('error', function (err) {
    refs.emit('error', err);
  });
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

  load(this, options.git || git.shared(), options.path || '');
}

inherits(Refs, EventEmitter);

Refs.prototype.ready = utils.latch('refs');
Refs.prototype.wrapCallback = utils.wrapCallback;

module.exports = utils.emitterFactory(Refs, 'refs');
module.exports.Refs = Refs;

