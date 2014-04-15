var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');

function Config(options) {
  var file;

  if (typeof options === 'string' || options instanceof String) {
    file = options;
    options = arguments[1] || {};
  } else {
    options = options || {};
    file = options.file;
  }

  if (!(this instanceof Config))
    return new Config(file, options);

  var cfg = this;
  process.nextTick(function () {
    cfg.emit('end');
  });
}

inherits(Config, EventEmitter);

module.exports = utils.emitterFactory(Config);
module.exports.Config = Config;
