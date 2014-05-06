# Class: git.Git

The git class serves as a basic helper for running git commands and supplying
arguments in a programmer-friendly manner.

A git instance is created with a `.git` directory and (optionally) a worktree
and additional configuration. These parameters are passed to `git` when
running any commands using the created instance.

All commands flatten their arguments according to these rules:

- If the argument is an array, append all entries to the arguments.
- If the argument is an object, prefix all keys with `--` and append all
  key value pairs as parameters.
- Otherwise, just push the append the argument.

## git.run([argument, ...])

## git.checkout([argument, ...], [callback])

## git.tag([argument, ...], [callback])

## git.branch([argument, ...], [callback])

## git.merge([argument, ...], [callback])

