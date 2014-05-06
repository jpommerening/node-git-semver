# git-semver

> Manage git repositories with semantic versioning

`git-semver` is a node module (and command line program) for managing git
repositories using semantic versioning. It's basically just a nice git API
that understands [semantic versioning](semver.org).

## Example

Open a local repository, select the latest tag that
[matches](https://www.npmjs.org/package/semver) "~1.1.8" and
check it's contents out into the repository's work tree.

```javascript
var git = require('git-semver');

git.repository('path/to/repository')
  .latest('~1.1.8')
  .checkout(function (err, ref) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
```

## API

The API is built around [events](http://nodejs.org/api/events.html) and
[streams](http://nodejs.org/api/stream.html). Most methods return a stream
and accept an optional callback that fires once the underlying stream
finishes or raises an error.

This allows for succinct code, that chains multiple methods (hello
[demeter](http://en.wikipedia.org/wiki/Law_of_Demeter)) synchronously and
waits until the asynchronous operations finish.

### Class git.Git

#### git.run([argument, ...])

#### git.checkout([argument, ...], [callback])

#### git.tag([argument, ...], [callback])

#### git.branch([argument, ...], [callback])

#### git.merge([argument, ...], [callback])

### Class: git.Repository

#### Event: 'gitdir'

#### Event: 'gitfile'

#### Event: 'worktree'

#### Event: 'end'

#### repository.config([callback])

#### repository.HEAD([callback])

#### repository.refs([path|options], [callback])

#### repository.tags([callback])

#### repository.heads([callback])

#### repository.versions([range], [callback])

#### repository.latest([range], [callback])

#### repository.checkout([reference], [options], [callback])

#### repository.tag([reference], name|options, [callback])

#### repository.branch([reference], name|options, [callback])

#### repository.merge(reference, [options], [callback])

### Class: git.Config

#### Event: 'gitdir'

#### Event: 'entry'

#### Event: 'end'

### Class: git.Reference

#### Event: 'gitdir'

#### Event: 'commit'

#### Event: 'end'

### Class: git.Refs

#### Event: 'gitdir'

#### Event: 'entry'

#### Event: 'end'

### Class: git.Versions

#### Event: 'gitdir'

#### Event: 'entry'

#### Event: 'end'

### Class: git.Submodules

#### Event: 'gitdir'

#### Event: 'commit'

#### Event: 'entry'

#### Event: 'end'

## [License](LICENSE-MIT)

Copyright (c) 2014 Jonas Pommerening

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
