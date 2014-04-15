var EOL = require('os').EOL;

/**
 * Create a factory for the given EventEmitter.
 * The constructor has to support being called without
 * new.
 * @returns a function that forwards all arguments to
 * the constructor, except the last one, which is expected
 * to be a nodejs style callback.
 */
function emitterFactory(ctor, eventName) {

  /**
   * createEmitter( [arguments, ...], callback )
   * On failure the callback is called with the error.
   * On success the callback is called with the emitter instance
   * as the second argument.
   * @param callback a nodejs style callback(err, emitter)
   * @returns the uninitialized emitter instance
   */
  function createEmitter() {
    var callback;
    var args;
    var emitter;

    if (typeof arguments[arguments.length - 1] === 'function') {
      callback = arguments[arguments.length - 1];
      args = [].slice.call(arguments, 0, arguments.length - 1);
    } else {
      args = [].slice.call(arguments);
    }

    emitter = ctor.apply(null, args);

    if (callback) {
      emitter.once(eventName || 'end', function () {
        callback(null, emitter);
      });
      emitter.once('error', function (err) {
        callback(err);
      });
    }

    return emitter;
  }

  return createEmitter;
}

/**
 * Creates a method that queues up any calls that are made (in form
 * of functions passed in) until a certain event is emitted.
 * Then, the queue is emptied and all future calls will be evaluated
 * on nextTick.
 */
function latch(eventName) {
  var ready = true;
  var queue = [];
  return function(callback) {
    if (ready) {
      process.nextTick(callback);
    } else {
      queue.push(callback);
      this.once(eventName || 'end', function () {
        ready = true;
        queue.forEach(process.nextTick);
        queue = [];
      });
    }
  };
}

/**
 * Wrap a the callback and return a node-style callback.
 * If an error occured, emit it.
 * Otherwise, call the provided callback with the remaining arguments.
 */
function wrapCallback(callback) {
  var emitter = this;

  return function (err) {
    if (err) {
      return emitter.emit('error', err);
    }
    return callback.apply(this, [].slice.call(arguments, 1));
  };
}


/**
 * Listen for data events and split them into lines.
 */
function emitLines(emitter) {
  var tail = '';

  function push(data) {
    var buffer = tail + data;
    var lines = buffer.split(EOL);

    tail = lines.splice(-1);
    lines.forEach(function (line) {
      emitter.emit('line', line.toString());
    });
  }

  emitter.on('data', push);
  emitter.on('end', function (data) {
    if (data) {
      push(data);
    }
    emitter.emit('line', tail.toString());
  });
}


module.exports = {
  emitterFactory: emitterFactory,
  emitLines: emitLines,
  latch: latch,
  wrapCallback: wrapCallback
};
