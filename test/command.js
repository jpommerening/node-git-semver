var expect = require('expect.js');

describe('command(events, handler, callback)', function () {

  'use strict';

  var command = require('../lib/command');

  it('returns a Command instance', function (done) {
    var cmd = command(['nothing'], function (done) {
      done();
    }, done);
    expect(cmd).to.be.a(command.Command);
    cmd.emit('nothing');
  });

});
