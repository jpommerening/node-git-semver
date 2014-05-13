//var expect = require('expect.js');

describe('queue([options])', function () {

  'use strict';

  var queue = require('../lib/queue');

  describe('.exclusive(callback, done)', function () {
    var q = queue({max: 10});

    it('executes given callback', function (done) {
      q.exclusive(function (done) {
        done();
      }, done);
    });

  });

  describe('.shared(callback, done)', function () {
  });


});
