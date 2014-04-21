var expect = require('expect.js');

describe('versions([options|range], [callback])', function () {

  'use strict';

  var fixture = require('./fixtures').repository;

  var versions = require('../lib/versions');

  it('returns a lazily populated Verisons instance', function (done) {
    var vrs = versions({ gitdir: fixture.gitdir }, done);
    expect(vrs).to.be.a(versions.Versions);
    expect(vrs['1.0.0']).to.be(undefined);
  });

});
