var fs = require('fs');
var path = require('path');
var repositories = require('./repositories');
var refs = require('./refs');
var root = path.join(__dirname, '../..');

for (var name in repositories) {
  repositories[name].tags = refs.tags;
  repositories[name].heads = refs.heads;
  repositories[name].HEAD = refs.HEAD;
}

var repository = repositories.repository;

repository.heads.master = repository.HEAD = fs.readFileSync(root + '/' + repository.gitdir + '/refs/heads/master');

module.exports = repositories;
