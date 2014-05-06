var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

/* new Command(['a', 'b'], function (a, b, done)) */
function Command(events, callback) {
  if (!(this instanceof Command)) {
    return new Command(events, callback);
  }

  EventEmitter.apply(this);

  var emitter = this;
  var done = function (err) {
    if (err) {
      emitter.emit('error', err);
    } else {
      var args = [].slice.apply(arguments);
      args[0] = 'end';
      emitter.emit.apply(emitter, args);
    }

    emitter.removeAllListeners();
  };

  utils.aggregateEvents.apply(null, [this].concat(events).concat([function () {
    var args = [].slice.apply(arguments);
    args.push(done);
    callback.apply(this, args);
  }]));
}
inherits(Command, EventEmitter);

/*

var cmd = command(['gitdir', 'workdir', 'commit'], function (gitdir, workdir, commit, done) {
  git({gitdir: gitdir, workdir: workdir}).checkout(commit, done);
}, function (err, result) {
});

*/

function command(events, handler, callback) {
  var cmd = new Command(events, handler);

  if (callback) {
    cmd.once('end', function () {
      var args = [].slice.apply(arguments);
      args.unshift(null);
      callback.apply(this, args);
    });
    cmd.once('error', callback);
  }
  return cmd;
}

command.Command = Command;

module.exports = command;
