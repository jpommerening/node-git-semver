var fs = require('fs');
var path = require('path');
var tmp = require('tmp');
var rimraf = require('rimraf');
var async = require('async');
var spawn = require('child_process').spawn;
var repositories = require('./repositories');
var refs = require('./refs');
var config = require('./config');
var root = path.join(__dirname, '../..');

for (var name in repositories) {
  repositories[name].tags = refs.tags;
  repositories[name].heads = refs.heads;
  repositories[name].HEAD = refs.HEAD;
  repositories[name].config = config;
}

/* Setup HEAD, master for main repo */
var repository = repositories.repository;
var master = root + '/' + repository.gitdir + '/refs/heads/master';
repository.heads.master = repository.HEAD = fs.readFileSync(master).toString().trim();

/* Create a function that runs git with the given arguments
 * and calls the callback when finished.
 */
function git() {
  var curry = [].slice.apply(arguments);
  return function () {
    var args = curry.concat([].slice.apply(arguments));
    var callback = args.pop();
    var childProcess = spawn('git', args); 

    childProcess.on('error', callback);
    childProcess.on('close', function (code) {
      if (code) {
        callback(new Error('`git ' + args.join(' ') + '` returned ' + code));
      } else {
        callback();
      }
    });
  };
}

/* Create temporary repo for destructive tests */
repositories.temporary = function (callback) {
  var source = repositories.remote;
  var worktree;

  return async.waterfall([
    tmp.dir,
    function(tmpdir, callback) {
      worktree = tmpdir;
      callback(null, worktree);
    },
    git('clone', source.gitdir),
    function (callback) {
      async.series(Object.keys(source.config).map(function (key) {
        return git('config', key, source.config[key]);
      }), callback);
    },
    function (results, callback) {
      callback(null, {
        gitdir: worktree + '/.git',
        worktree: worktree,
        bare: false,
        origin: source.gitdir,
        HEAD: source.HEAD,
        heads: source.heads,
        tags: source.tags,
        config: source.config,
        remove: function (cb) {
          rimraf(worktree, cb);
        }
      });
    }
  ], callback);
};

module.exports = repositories;
