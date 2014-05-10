# Class: git.Git

The git class serves as a basic helper for running git commands and supplying
arguments in a programmer-friendly manner. It depends on
[which](https://www.npmjs.org/package/which) to find a working git executable.

A git instance is created with a `.git` directory and (optionally) a worktree
and additional configuration. These parameters are passed to `git` when
running any commands using the created instance.

All commands flatten their arguments according to these rules:

- If the argument is an array, append all entries to the arguments.
- If the argument is an object, prefix all keys with `--` and append all
  key value pairs as parameters. If the value is `true` omit it, if it
  is `false` prefix with `--no-` instead.
- Otherwise, just append the argument.

For example, if you want to run
`git log --oneline --decorate=short --no-merges origin/master` inside the
(bare) repository `gh/node-git-semver.git` you can do it like this:

```javascript
var cp = git({gitdir: 'gh/node-git-semver'}).spawn('log', {
  oneline: true,
  decorate: 'short',
  merges: false
}, 'origin/master');
```

## git.spawn([argument, ...])

Spawn a git [child process][childprocess] and return it.

## git.run([argument, ...], [callback])

Spawn a [child process][childprocess] and optionally attach a callback to
the `end` and `error` events. If the command returns 0, the callback will
be called with a result object as the second parameter. The result object
contains the following properties:

- `gitdir`: The git directory that was passed to git via `--git-dir`.
- `worktree`: The work tree that was passed to git via `--work-tree`.
- `config`: The configuration that was passed to git.
- `args`: The flattened arguments git was called with.
- `code`: The return code of the git process.

If the child process fires an `error` event, or if the return code is not
zero the callback will be called with an _Error_ object, extended with the
properties of the result object.

## git.checkout([argument, ...],equal [callback])

Alias for `run` with `checkout` as the first argument.

## git.tag([argument, ...], [callback])

Alias for `run` with `tag` as the first argument.

## git.branch([argument, ...], [callback])

Alias for `run` with `branch` as the first argument.

## git.merge([argument, ...], [callback])

Alias for `run` with `merge` as the first argument.

[childprocess]: http://nodejs.org/api/child_process.html "nodejs.org/api: Child Process"
