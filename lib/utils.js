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
 * Listen for data events and split them into lines.
 * @returns the emitter
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

  return emitter;
}

/**
 * Pipe events from one emitter to another.
 * @returns the emitter piped to
 */
function pipeEvents(from, eventNames, to) {
  eventNames.forEach(function (eventName) {
    from.on(eventName, to.emit.bind(to, eventName));
  });
  return to;
}

/**
 * Creates a method that queues up any calls that are made (in form
 * of functions passed in) until a certain event is emitted.
 * Then, the queue is emptied and all future calls will be evaluated
 * on nextTick.
 */
function latch(eventName) {
  var queue = [];
  var args;
  function call(callback) {
    callback.apply(this, args);
  }
  return function(callback) {
    if (args !== undefined) {
      call(callback);
    } else {
      queue.push(callback);
      this.once(eventName || 'end', function () {
        args = [].slice.apply(arguments);
        queue.forEach(call);
        queue = [];
      });
    }
  };
}

/**
 * Insert an item into an object at the specified path.
 */
function objectInsert(object, path, value) {
  var root = path.pop();

  path.forEach(function (entry) {
    if (!object.hasOwnProperty(entry)) {
      object[entry] = {};
    }
    object = object[entry];
  });

  object[root] = value;
}

module.exports = {
  emitterFactory: emitterFactory,
  emitLines: emitLines,
  pipeEvents: pipeEvents,
  latch: latch,
  objectInsert: objectInsert
};
