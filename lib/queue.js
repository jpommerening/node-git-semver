function Queue(options) {
  if (!(this instanceof Queue)) {
    return new Queue(options);
  }

  this.max = options.max;
  this.active = [];
  this.queue = [];
}

Queue.prototype.run = function run() {
  var entry;
  var queue = this;
  while (!!(entry = this.shift())) {
    queue.active.push(entry);
    entry();
  }
  return this;
};

Queue.prototype.shift = function shift() {
  var entry = this.queue[0];

  if( !entry || entry.max <= this.active.length ) {
    return null;
  } else {
    return this.queue.shift();
  }
};

Queue.prototype.entry = function entry( cb, max, args, done ) {
  var queue = this;
  args.push(function () {
    var i = queue.active.indexOf(e);
    queue.active.splice(i, 1);
    done.apply(queue, arguments);
    queue.run();
  });
  var e = function() {
    return cb.apply(queue, args);
  };
  e.max = max;
  return e;
};

Queue.prototype.exclusive = function( cb, done ) {
  var entry = this.entry( cb, 1, [], done );
  this.queue.push( entry );
  return this.run();
};

Queue.prototype.shared = function( cb, done ) {
  var entry = this.entry( cb, this.max, [], done );
  this.queue.push( entry );
  return this.run();
};

function queue(options) {
  return new Queue(options);
}

queue.Queue = Queue;

module.exports = queue;
