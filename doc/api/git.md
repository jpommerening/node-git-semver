# Class: git.Git

The git class serves as a basic helper for running git commands and supplying
arguments in a programmer-friendly manner.

It uses [which](https://www.npmjs.org/package/which) to find a working git
executable.

A git instance is created with a `.git` directory and (optionally) a worktree
and additional configuration. These parameters are passed to `git` when
running any commands using the created instance.

All commands flatten their arguments according to these rules:

- If the argument is an array, append all entries to the arguments.
- If the argument is an object, prefix all keys with `--` and append all
  key value pairs as parameters. If the value is `true` omit it, if it
  is `false` prefix with `--no-` instead.
- Otherwise, just push the append the argument.

For example, if you want to run
`git log --oneline --decorate=short --no-merges origin/master` inside the
(bare) repository `gh/node-git-semver.git` you can do it like this:

```javascript
var cp = git({gitdir: 'gh/node-git-semver'}).run('log', {
  oneline: true,
  decorate: 'short',
  merges: false
}, 'origin/master');
```

## git.run([argument, ...])

## git.checkout([argument, ...], [callback])

## git.tag([argument, ...], [callback])

## git.branch([argument, ...], [callback])

## git.merge([argument, ...], [callback])

