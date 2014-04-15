/*global describe, it, beforeEach*/

var expect = require('expect.js');
var path = require('path');
var findup = require('findup');

describe('config([path, [options,]] callback)', function () {

  'use strict';

  var config = require('../lib/config');

  it('returns a lazily populated Config instance', function (done) {
    var cfg = config(done);
    expect(cfg).to.be.a(config.Config);
    expect(cfg.bare).to.be(undefined);
  });

  describe('when called with only a callback', function () {
    var cfg;

    beforeEach(function (done) {
      cfg = config(done);
    });
  });

});
