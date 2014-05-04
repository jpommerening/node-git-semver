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
 * TODO: Maybe obsolete.
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
 * Build a path filter from the given options, that can be used
 * with Array.filter or Array.map.
 * If the options object contains a "path" property, matches need
 * to be in a subdirectory of the given path. The output
 * will be relative to the given path.
 * If the options object contains a "filter" property and it is either
 * a function or an object with a "test" method, it will be used to
 * further filter the output.
 * @returns a function that returns either the matching path name
 * or false if the path did not match.
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
 * Create a factory for the given EventEmitter.
 * The constructor has to support being called without
 * new.
 * @returns a function that forwards all arguments to
 * the constructor, except the last one, which is expected
 * to be a nodejs style callback.
 */
function emitterFactory(ctor) {

  /**
   * On failure the callback is called with the error.
   * On success the callback is called with the emitter instance
   * as the second argument.
   * @param callback a nodejs style callback(err, emitter)
   * @returns the uninitialized emitter instance
   */
  function createEmitter(/* [args, ...], callback*/) {
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

  events.forEach(function (event) {
    emitter.on(event, function () {
      data[event] = [].slice.apply(arguments);
    });
  });

  return emitter.on('newListener', function (event /* listener */) {
    if (data.hasOwnProperty(event)) {
      var args = [event].concat(data[event]);
      process.nextTick(function () {
        emitter.emit.apply(emitter, args);
      });
    }
  });
}

/**
 * Wait until each event appeared at least once. Then call the
 * the given callback with the concatenated payloads of the
 * first occurance of each event.
 * @returns the emitter
 */
function aggregateEvents(emitter /* event, [event, ...] */, callback) {
  var events = [].slice.call(arguments, 1);
  callback = events.pop();
  var data = {};

  function maybeCallback() {
    var args = [];
    for (var i=0; i<events.length; i++) {
      if (data.hasOwnProperty(events[i])) {
        args.push.apply(args, data[events[i]]);
      } else {
        return;
      }
    }
    callback.apply(emitter, args);
  }

  events.map(function (event) {
    emitter.once(event, function () {
      data[event] = [].slice.apply(arguments);
      maybeCallback();
    });
  });

  return emitter;
}

/**
 * Pipe events from one emitter to another.
 * @returns the emitter piped to
 */
function pipeEvents(from /* event, [event, ...] */, to) {
  var events = [].slice.call(arguments, 1);
  to = events.pop();
  events.forEach(function (event) {
    from.on(event, to.emit.bind(to, event));
  });
  return to;
}

/**
 * Pipe events from once emitter to another, but use `.once`.
 * @returns the emitter piped to
 */
pipeEvents.once = function pipeEventsOnce(from /* event, [event, ...] */, to) {
  var events = [].slice.call(arguments, 1);
  to = events.pop();
  events.forEach(function (event) {
    from.once(event, to.emit.bind(to, event));
  });
  return to;
};

/**
 * TODO: Maybe obsolete.
 * collectEvents({target: [ e1, e2, .. eN ]})
 * Wait for a bunch of events and once they all appeared
 * at least once, emit a target event with all the source events' payload.
 */
function collectEvents(emitter, map) {

  Object.keys(map).forEach(function (event) {
    var args = [emitter].concat(map[event]);
    args.push(function () {
      var args = [event].concat([].slice.apply(arguments));
      process.nextTick(function () {
        emitter.emit.apply(emitter, args);
      });
    });
    aggregateEvents.apply(null, args);
  });

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

module.exports = {
  objectInsert: objectInsert,
  invertMap: invertMap,
  arrayEqual: arrayEqual,
  makeFilter: makeFilter,
  emitterFactory: emitterFactory,
  emitLines: emitLines,
  latchEvents: latchEvents,
  aggregateEvents: aggregateEvents,
  pipeEvents: pipeEvents,
  collectEvents: collectEvents,
  collectStream: collectStream
};
