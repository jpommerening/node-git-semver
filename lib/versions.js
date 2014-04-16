var semver = require('semver');

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var utils = require('./utils');

var git = require('./git');
var refs = require('./refs');

/**
 * 
 */
function onGitdir(vrs, options) {
  var gitdir;
  return function (dir) {
    if (dir !== gitdir) {
      gitdir = dir;

      var tags = refs({ gitdir: gitdir, path: 'refs/tags', filter: options.range });
      tags.on('entry', function (tag, commit) {
        var parsed = semver.parse(tag);

        if (parsed) {
          var version = parsed.version + (parsed.build.length ? '+' + parsed.build.join('.') : '');
          /* console.log(parsed.prerelease, parsed.build, version); */
          vrs.emit('entry', version, commit);
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
  return function (version, commit) {
    vrs[version] = commit;
  };
}

function Versions(options) {
  if (typeof options === 'string' || options instanceof String) {
    options = { range: semver.Range(options) };
  } else if (options instanceof semver.Range) {
    options = { range: options };
  } else {
    options = options || {};
  }

  if (!(this instanceof Versions)) {
    return new Versions(options);
  }

  this.on('gitdir', onGitdir(this, options));
  this.on('entry', onEntry(this, options));

  if (options.gitdir) {
    this.emit('gitdir', options.gitdir);
  }
}

inherits(Versions, EventEmitter);

module.exports = utils.emitterFactory(Versions);
module.exports.Versions = Versions;
