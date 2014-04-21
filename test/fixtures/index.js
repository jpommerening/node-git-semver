var fs = require('fs');
var path = require('path');
var tmp = require('tmp');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var repositories = require('./repositories');
var refs = require('./refs');
var root = path.join(__dirname, '../..');

for (var name in repositories) {
  repositories[name].tags = refs.tags;
  repositories[name].heads = refs.heads;
  repositories[name].HEAD = refs.HEAD;
}

/* Setup HEAD, master for main repo */
var repository = repositories.repository;
var master = root + '/' + repository.gitdir + '/refs/heads/master';
repository.heads.master = repository.HEAD = fs.readFileSync(master).toString().trim();

/* Create temporary repo for destructive tests */
repositories.temporary = function (cb) {
  var source = repositories.remote;

  tmp.dir(function (err, worktree) {
    if (err) {
      cb(err);
    }

    var origin = source.gitdir;
    var childProcess = spawn('git', ['clone', origin, worktree]);

    childProcess.on('error', function (err) {
      cb(err);
    });

    childProcess.on('close', function () {
      cb(null, {
        gitdir: worktree + '/.git',
        worktree: worktree,
        bare: false,
        origin: origin,
        HEAD: source.HEAD,
        heads: source.heads,
        tags: source.tags,
        remove: function (cb) {
          rimraf(worktree, cb);
        }
      });
    });
  });
};

module.exports = repositories;
