var EOL = require('os').EOL;

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

/**
 * Take an object mapping keys to lists and return
 * an object that maps the values inside the lists to
 * their respective keys.
 *
 * invertMap({ a: [ 'one', 'two' ],
 *             b: [ 'two', 'three' ] })
 * { one: [ 'a' ],
 *   two: [ 'a', 'b' ],
 *   three: [ 'b' ] }
 */
function invertMap(object) {
  var result = {};
  var value, key, i;

  for (key in object) {
    for (i=0; i<object[key].length; i++) {
      value = object[key][i];
      if (result.hasOwnProperty(value) && result[value].indexOf(key) < 0) {
        result[value].push(key);
      } else {
        result[value] = [key];
      }
    }
  }
  return result;
}

/**
 * Check if the given arrays (or arguments objects)
 * are equal.
 */
function arrayEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a == null || b == null || a.length !== b.length) {
    return false;
  }
  for (var i=0; i<a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Create a factory for the given EventEmitter.
 * The constructor has to support being called without
 * new.
 * @returns a function that forwards all arguments to
 * the constructor, except the last one, which is expected
 * to be a nodejs style callback.
 */
function emitterFactory(ctor) {

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
    var args = [].slice.apply(arguments);
    var emitter;

    if (typeof args[args.length-1] === 'function') {
      callback = args.pop();
    }

    emitter = ctor.apply(null, args);

    if (callback) {
      emitter.once('end', function () {
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
 * Record the given events and their payload. Then, when
 * a listener is attached for any of the given events, emit
 * the event with it's payload.
 * @returns the emitter
 */
function latchEvents(emitter /* event, [event, ...] */) {
  var events = [].slice.call(arguments, 1);
  var data = {};
  var active = {};

  events.forEach(function (event) {
    emitter.on(event, function () {
      data[event] = [].slice.apply(arguments);
    });
  });

  return emitter.on('newListener', function (event, listener) {
    if (data.hasOwnProperty(event)) {
      var args = [event].concat(data[event]);
      setImmediate(function () {
        emitter.emit.apply(emitter, args);
      });
    }
  });
}

/**
 * collectEvents({target: [ e1, e2, .. eN ]})
 * Wait for a bunch of events and once they all appeared
 * at least once, emit a target event with all the source events' payload.
 */
function collectEvents(emitter, map) {
  var data = {};
  var triggers = invertMap(map);

  function maybeEmit(event) {
    var args = [event];
    var events = map[event];
    if (!events) {
      return;
    }
    for (var i=0; i<events.length; i++) {
      if (data.hasOwnProperty(events[i])) {
        args.push.apply(args, data[events[i]]);
      } else {
        return;
      }
    }
    process.nextTick(function () {
      emitter.emit.apply(emitter, args);
    });
  }

  Object.keys(triggers).forEach(function (event) {
    emitter.on(event, function () {
      if (!arrayEqual(data[event], arguments)) {
        data[event] = [].slice.apply(arguments);
        triggers[event].forEach(maybeEmit);
      }
    });
  });

  emitter.on('newListener', maybeEmit);

  return emitter;
}

/**
 * Collect all data into a single buffer and
 * call the given callback when done.
 */
function collectStream(stream, cb) {
  var bufs = [];

  stream.on('data', bufs.push.bind(bufs));
  stream.on('end', function (data) {
    if (data) {
      bufs.push(data);
    }
    cb(Buffer.concat(bufs));
  });
}

/**
 * Pipe events from one emitter to another.
 * @returns the emitter piped to
 */
function pipeEvents(from, events, to) {
  events.forEach(function (event) {
    from.on(events, to.emit.bind(to, event));
  });
  return to;
}

module.exports = {
  objectInsert: objectInsert,
  invertMap: invertMap,
  arrayEqual: arrayEqual,
  emitterFactory: emitterFactory,
  emitLines: emitLines,
  latchEvents: latchEvents,
  collectEvents: collectEvents,
  collectStream: collectStream,
  pipeEvents: pipeEvents
};
