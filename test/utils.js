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

});
