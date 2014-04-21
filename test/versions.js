var expect = require('expect.js');
var semver = require('semver');

describe('versions([options|range], [callback])', function () {

  'use strict';

  var fixture = require('./fixtures').repository;

  var versions = require('../lib/versions');

  it('returns a lazily populated Versions instance', function (done) {
    var vrs = versions({gitdir: fixture.gitdir}, done);
    expect(vrs).to.be.a(versions.Versions);
    expect(vrs['1.0.0']).to.be(undefined);
  });

  it('resolves all available versions as references', function (done) {
    versions({gitdir: fixture.gitdir}, function (err, vrs) {
      expect(vrs['1.0.0']).to.equal(fixture.tags['v1.0.0']);
      done(err);
    });
  });

});

describe('versions.latest([options|range], [callback])', function () {

  'use strict';

  var fixture = require('./fixtures').repository;

  var versions = require('../lib/versions');
  var reference = require('../lib/reference');

  it('returns a lazily populated Reference instance', function (done) {
    var ref = versions.latest({gitdir: fixture.gitdir}, done);
    expect(ref).to.be.a(reference.Reference);
  });

  it('points the returned Reference instance to the latest version matching the given range', function (done) {
    versions.latest({gitdir: fixture.gitdir, range: semver.Range('0.x')}, function (err, ref) {
      expect(ref.commit).to.equal(fixture.tags['v0.2.1']);
      done(err);
    });
  });

});
