
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
    var callback = arguments[arguments.length - 1];
    var args = [].slice.call(arguments, 0, arguments.length - 1);
    var emitter = ctor.apply(null, args);

    emitter.once('end', function () {
      callback(null, emitter);
    });
    emitter.once('error', function (err) {
      callback(err);
    });

    return emitter;
  };

  return createEmitter;
}

module.exports = {
  emitterFactory: emitterFactory
};
