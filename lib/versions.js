var semver = require('semver');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var refs = require('./refs');
var reference = require('./reference');

/**
 * 
 */
function onGitdir(vrs, options) {
  var gitdir;
  return function (dir) {
    if (dir !== gitdir) {
      gitdir = dir;

      var tags = refs({gitdir: gitdir, path: 'refs/tags', filter: options.range});
      tags.on('entry', function (ref, name) {
        var parsed = semver.parse(name);

        if (parsed) {
          var version = parsed.version + (parsed.build.length ? '+' + parsed.build.join('.') : '');
          /* console.log(parsed.prerelease, parsed.build, version); */
          vrs.emit('entry', ref, version);
        }
      }).on('end', function () {
        vrs.emit('end');
      });
    }
  };
}

/**
 * 
 */
function onEntry(vrs /*, options*/) {
  return function (ref, version) {
    vrs[version] = ref;
    vrs.all.push(version);
  };
}

function Versions(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = {range: semver.Range(options)};
  } else if (options instanceof semver.Range) {
    options = {range: options};
  } else {
    options = options || {};
  }

  if (!(this instanceof Versions)) {
    return new Versions(options);
  }

  EventEmitter.apply(this);

  this.all = [];
  this.on('gitdir', onGitdir(this, options));
  this.on('entry', onEntry(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Versions, EventEmitter);

Versions.prototype.latest = function (cb) {
  var ref = reference(cb);
  var vrs = this;

  function emit() {
    var v = semver.sort(vrs.all).pop();
    ref.emit('commit', vrs[v].commit);
    ref.emit('end');
  }

  if (this.all.length) {
    emit();
  } else {
    this.on('end', emit);
  }

  return ref;
};

var versions = module.exports = utils.emitterFactory(Versions);
versions.Versions = Versions;
versions.latest = function () {
  var last = arguments.length - 1;
  var callback;
  var args;

  /* peel off callback */
  if (typeof arguments[last] === 'function') {
    callback = arguments[last];
    args = [].slice.call(arguments, 0, last);
  } else {
    args = [].slice.call(arguments);
  }

  var vrs = versions.apply(this, args);
  var ref = vrs.latest(callback);
  /* TODO: The reference would try to resolve HEAD if we
   *       emit gitdir too early. That's stupid. */
  ref.removeAllListeners('gitdir');
  ref.on('gitdir', function (dir) {
    vrs.emit('gitdir', dir);
  });
  return ref;
};
