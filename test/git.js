/*global describe, it*/

var expect = require('expect.js');
var child_process = require('child_process');

describe('git([options])', function () {
  'use strict';

  var git = require('../lib/git');

  it('returns a Git instance', function () {
    var g = git();
    expect(g).to.be.a(git.Git);
  });

  describe('.run([argument[, argument]])', function (done) {

    it('runs the git executable with the specified arguments', function (done) {
      var g = git();
      var cp = g.run('--version');
      cp.on('close', function (code) {
        expect(code).to.be(0);
        done();
      });
    });

    it('flattens object and array arguments', function (done) {
      var g = git();
      var cp = g.run({version: true});
      cp.on('close', function (code) {
        expect(code).to.be(0);
        done();
      });
    });

    it('adds configuration that was passed during creation', function (done) {
      var g = git({config: { 'test.test': true }});
      var cp = g.run('config', '--get', 'test.test');
      var buffer = '';
      cp.stdout.on('data', function (data) {
        buffer += data;
      });
      cp.on('close', function (code) {
        expect(buffer.trim()).to.be('true');
        expect(code).to.be(0);
        done();
      });
    });
  });

});
