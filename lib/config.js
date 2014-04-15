var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

function insert(cfg, key, value) {
  cfg[key] = value;

  if (key.indexOf('.') >= 0) {
    var path = key.split('.');
    var object = cfg;
    key = path.pop();

    path.forEach(function (key) {
      if (!object.hasOwnProperty(key)) {
        object[key] = {};
      }
      object = object[key];
    });

    if (value === 'false') {
      value = false;
    } else if (value === 'true') {
      value = true;
    }

    object[key] = value;
  }
}

function load(cfg, g, file) {
  var args = [ 'config', '--list' ];

  if (file !== undefined) {
    args.splice(1, 0, '--file', file);
  }

  var childProcess = g.run(args);

  utils.emitLines(childProcess.stdout);

  childProcess.stdout.on('line', function (line) {
    var eq = line.indexOf('=');
    var key = line.substr(0, eq);
    var value = line.substr(eq+1);
    insert(cfg, key, value);
  });
  childProcess.on('close', function () {
    cfg.emit('config', {});
  });
  childProcess.on('error', function (err) {
    cfg.emit('error', err);
  });
}

function Config(options) {
  var file;

  if (typeof options === 'string' || options instanceof String) {
    file = options;
    options = arguments[1] || {};
  } else {
    options = options || {};
    file = options.file;
  }

  if (!(this instanceof Config)) {
    return new Config(file, options);
  }

  load(this, options.git || git.shared(), file);
}

inherits(Config, EventEmitter);

Config.prototype.ready = utils.latch('config');
Config.prototype.wrapCallback = utils.wrapCallback;

module.exports = utils.emitterFactory(Config, 'config');
module.exports.Config = Config;
