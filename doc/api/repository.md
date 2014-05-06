# Class: git.Repository

The repository is the central point of most of your git interactions.
It serves as both a point for dispatching git commands and as a queue
that keeps the destructive operations in order.

The repository class distinguishes between non-destructive (read-only)
and destructive (in the sense that they change something inside the
repository) operations. The former are executed in parall while the
latter run one at a time. In any case operations will be started in
the order they are triggered.

Thus, the following example will first read the git config and tags
in parallel, then check out the `master` branch and finally tag it
as `v1.2.0`:

```javascript
repo.config(function (err, cfg) {
  /* do something with the configuration */
}).versions('1.x', function (err, versions) {
  /* do something with matching versions */
}).checkout('master').tag('v1.2.0', function (err) {
  /* done tagging master as 1.2.0 */
});
```

## Event: 'gitdir'

Emitted once the repository has found it's `.git` directory. The event
payload is the path of the directory.

## Event: 'gitfile'

If the `.git` directory is not present in the work tree, git places a
`.git` file into the the work tree that serves as a symbolic link to
the actual directory. This is most commonly the case when working with
submodules. The `gitfile` event is emitted if repository has detected
the file and is about to resolve the directory mentioned therein.

## Event: 'worktree'

Emitted once the repository has found the work tree containing the git
checkout. If the repository is not "bare", the work tree will be emitted
either before (if pointed to a path in the checkout) or after the `.git`
directory, the latter being the case when using git's config mechanisms
to resolve the work tree.

## Event: 'bare'

Emitted _if_ the repository is a bare repository.

## Event: 'end'

Emitted once the `.git` directory is known and the repository is either
known to be "bare" or the work tree has been located. Usually this also
marks the point where the other methods start to do their work.

## repository.config([callback])

## repository.HEAD([callback])

## repository.refs([path|options], [callback])

## repository.tags([callback])

## repository.heads([callback])

## repository.versions([range], [callback])

## repository.latest([range], [callback])

## repository.checkout([reference], [options], [callback])

## repository.tag(name, [reference], [options], [callback])

## repository.branch(name, [reference], [options], [callback])

## repository.merge(reference, [options], [callback])

