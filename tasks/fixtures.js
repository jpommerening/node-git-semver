var fs = require('fs');
var path = require('path');
var tar = require('tar');
var which = require('which');
var async = require('async');

module.exports = function (grunt) {

  var root = path.dirname(__dirname) + '/';
  var git = which.sync('git');

  function extract(file, target, cb) {
    fs.createReadStream(root + file)
      .pipe(tar.Extract({ path: root + target }))
      .on('error', function (err) {
        grunt.fail.fatal(err);
      })
      .on('end', function () {
        grunt.log.ok('Extracted ' + file + ' to ' + target);
        cb();
      });
  }

  function rungit(args, opts, msg, cb) {
    grunt.verbose.writeln('Running ' + git + ' ' + args.join(' '));
    grunt.util.spawn({
      cmd: git,
      args: args,
      opts: opts
    }, function (err, result, code) {
      grunt.log.debug(result.stdout + '\n');
      if (code) {
        err = new Error('git ' + args.join(' ') + ' returned ' + code);
      }
      if (err) {
        cb(err);
      } else {
        grunt.log.ok(msg);
        cb();
      }
    });
  }

  function clone(remote, target, bare, cb) {
    var args = [ 'clone', root + remote, root + target ];
    if (bare) {
      args.splice(1, 0, '--bare');
    }

    rungit(args, {}, 'Cloned ' + (bare ? '(bare) ' : '') + remote + ' to ' + target, cb);
  }

  function submodule(remote, repository, target, cb) {
    var sub = path.relative(root + repository, root + target);
    var args = [ 'submodule', 'add', root + remote, sub ];

    var opts = {cwd: repository};

    rungit(args, opts, 'Added submodule ' + remote + 'in ' + repository + '/' + sub, function (err) {
      if (err) {
        return cb(err);
      }
      rungit(['commit', '-m', 'added submodule'], opts, 'Committed added submodule in ' + repository, cb);
    });
  }

  grunt.registerTask('fixtures', function() {
    var done = this.async();

    var fixtures = grunt.file.readJSON('test/fixtures/repositories.json');

    function step(fn) {
      var args = [].slice.call(arguments, 1);

      return function (cb) {
        args.push(cb);
        fn.apply(this, args);
      };
    }

    async.series([
      step(extract, fixtures.remote.extract, fixtures.remote.gitdir),
      step(clone, fixtures.remote.gitdir, fixtures.repository.worktree, false),
      step(clone, fixtures.remote.gitdir, fixtures.bare.gitdir, true),
      step(submodule, fixtures.remote.gitdir, fixtures.repository.worktree, fixtures.submodule.worktree)
    ], done);
  });

};
