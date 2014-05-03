var expect = require('expect.js');

describe('utils', function () {

  'use strict';

  var utils = require('../lib/utils');

  describe('.objectInsert(object, path, value)', function () {

    it('inserts the value into the given object at the given path', function () {
      var object = {};
      utils.objectInsert(object, ['path', 'to', 'property'], 'value');
      expect(object.path.to.property).to.equal('value');
    });

  });

  describe('.invertMap(object)', function () {

    var fixture = {
      a: [ 'one', 'two' ],
      b: [ 'two', 'three' ]
    };

    it('returns a new object', function () {
      expect(utils.invertMap(fixture)).to.be.an(Object);
    });

    it('creates properties for all list values', function () {
      var object = utils.invertMap(fixture);
      expect(object.one).to.not.be(undefined);
      expect(object.two).to.not.be(undefined);
      expect(object.three).to.not.be(undefined);
    });

    it('creates mappings from the list values to the input object\'s keys', function () {
      var object = utils.invertMap(fixture);
      expect(object.one).to.contain('a');
      expect(object.two).to.contain('a');
      expect(object.two).to.contain('b');
      expect(object.three).to.contain('b');
    });

  });

  describe('.arrayEqual(array1, array2)', function () {

    it('returns false if one of the arguments is null or undefined', function () {
      expect(utils.arrayEqual(null, [1, 2, 3])).to.be(false);
      expect(utils.arrayEqual(undefined, [1, 2, 3])).to.be(false);
      expect(utils.arrayEqual([1, 2, 3], null)).to.be(false);
      expect(utils.arrayEqual([1, 2, 3], undefined)).to.be(false);
    });

    it('returns true if both arguments are array with equal elements', function () {
      expect(utils.arrayEqual([1, 2, 3], [1, 2, 3])).to.be(true);
    });

    it('compares arrays with arguments objects', function () {
      function cmp() {
        expect(utils.arrayEqual(arguments, [1, 2, 3])).to.be(true);
        expect(utils.arrayEqual([1, 2, 3], arguments)).to.be(true);
        expect(utils.arrayEqual([3, 2, 1], arguments)).to.be(false);
        expect(utils.arrayEqual(arguments, [3, 2, 1])).to.be(false);
        expect(utils.arrayEqual([1, 2], arguments)).to.be(false);
        expect(utils.arrayEqual(arguments, [1, 2, 3, 4])).to.be(false);
      }
      cmp(1, 2, 3);
    });

  });

  describe('.latchEvents(emitter, event, [event, ...] )', function () {

    var EventEmitter = require('events').EventEmitter;

    it('returns the emitter', function () {
      var emitter = new EventEmitter();
      expect(utils.latchEvents(emitter, 'event')).to.be(emitter);
    });

    it('records the given events and triggers them when listeners are attached', function (done) {
      var called = false;
      var emitter = new EventEmitter().once('error', done);

      utils.latchEvents(emitter, 'event');
      emitter.emit('event');
      emitter.on('event', function () {
        called = true;
        emitter.emit('end');
      });

      emitter.once('end', function () {
        expect(called).to.be(true);
        done();
      });
    });

    it('calls new listeners asynchronously', function (done) {
      var called = false;
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.latchEvents(emitter, 'event');
      emitter.emit('event');
      emitter.on('event', function () {
        called = true;
        emitter.emit('end');
      });
      expect(called).to.be(false);
    });

    it('records the event payload', function (done) {
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.latchEvents(emitter, 'event');
      emitter.emit('event', 1, 2, 3);
      emitter.on('event', function () {
        expect([].slice.apply(arguments)).to.eql([1, 2, 3]);
        emitter.emit('end');
      });
    });

    it('does not call listeners attached with "once" more than once', function (done) {
      var called = 0;
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.latchEvents(emitter, 'event');
      emitter.emit('event');
      emitter.once('event', function () {
        expect(called++).to.be(0);
        process.nextTick(function () {
          emitter.emit('end');
        });
      });
    });

    it('does NOT keep the order of events', function (done) {
      var called = false;
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.latchEvents(emitter, 'event');
      emitter.emit('event');
      emitter.on('event', function () {
        expect(called).to.be(true);
        called = true;
        emitter.emit('end');
      });
      emitter.on('event2', function () {
        expect(called).to.be(false);
        called = true;
      });

      /* event2 is emitted BEFORE event */
      emitter.emit('event2');
    });

  });

  describe('.aggregateEvents(emitter, event, [event, ...], callback)', function () {

    var EventEmitter = require('events').EventEmitter;

    it('returns the emitter', function () {
      var emitter = new EventEmitter();
      expect(utils.aggregateEvents(emitter, 'event', function () {})).to.be(emitter);
    });

    it('calls the given callback once all named events appeared', function (done) {
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.aggregateEvents(emitter, 'event1', 'event2', function () {
        emitter.emit('end');
      });
      emitter.emit('event1');
      emitter.emit('event2');
    });

    it('passes the event payload to the given callback', function (done) {
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.aggregateEvents(emitter, 'event1', 'event2', function (data1a, data1b, data2) {
        expect(data1a).to.be(1);
        expect(data1b).to.be('b');
        expect(data2).to.be(2);
        emitter.emit('end');
      });
      emitter.emit('event1', 1, 'b');
      emitter.emit('event2', 2);
    });

    it('calls the callback with the first payload the appeared', function (done) {
      var emitter = new EventEmitter().once('error', done).once('end', done);

      utils.aggregateEvents(emitter, 'event1', 'event2', function (data) {
        expect(data).to.be(1);
        emitter.emit('end');
      });
      emitter.emit('event1', 1);
      emitter.emit('event1', 2);
      emitter.emit('event1', 3);
      emitter.emit('event2');
    });

    it('calls the callback only once', function (done) {
      var emitter = new EventEmitter().once('error', done);
      var called = 0;

      utils.aggregateEvents(emitter, 'event1', 'event2', function () {
        called++;
      });
      emitter.emit('event1');
      emitter.emit('event2');
      emitter.emit('event1');
      emitter.emit('event2');

      emitter.once('end', function () {
        expect(called).to.be(1);
        done();
      });
      emitter.emit('end');
    });

  });

  describe('.pipeEvents(from, event, [event, ...], to)', function () {

    var EventEmitter = require('events').EventEmitter;

    it('returns the target emitter', function (done) {
      var source = new EventEmitter().once('error', done);
      var target = new EventEmitter().once('error', done);

      var emitter = utils.pipeEvents(source, 'event1', 'event2', target);
      expect(emitter).to.be(target);
      done();
    });

    it('listens for the given events on the source emitter', function (done) {
      var source = new EventEmitter().once('error', done);
      var target = new EventEmitter().once('error', done);

      utils.pipeEvents(source, 'event1', 'event2', target);

      expect(source.listeners('event1')).to.not.be.empty();
      expect(source.listeners('event2')).to.not.be.empty();
      done();
    });

    it('pipes the given events and their payload to the source emitter', function (done) {
      var source = new EventEmitter().once('error', done);
      var target = new EventEmitter().once('error', done);
      var called = false;

      utils.pipeEvents(source, 'event', 'end', target);

      target.on('event', function () {
        expect([].slice.apply(arguments)).to.eql([1, 2, 3]);
        called = true;
      });

      target.on('end', function () {
        expect(called).to.be(true);
        done();
      });

      source.emit('event', 1, 2, 3);
      source.emit('end');
    });

  });

  describe('.pipeEvents.once(from, event, [event, ...], to)', function () {

    var EventEmitter = require('events').EventEmitter;

    it('removes the listeners once the events appeared', function (done) {
      var source = new EventEmitter().once('error', done);
      var target = new EventEmitter().once('error', done);

      utils.pipeEvents.once(source, 'event1', 'event2', target);

      source.emit('event1');
      source.emit('event2');

      expect(source.listeners('event1')).to.be.empty();
      expect(source.listeners('event2')).to.be.empty();
      done();
    });

  });

});
