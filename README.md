# git-semver

> Manage git repositories with semantic versioning

`git-semver` is a node module (and command line program) for managing git
repositories using semantic versioning. It's basically just a nice git API
that understands [semantic versioning][semver].

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

## [API](doc/api)

The API is built around [events][events] and [streams][stream]. Most methods
return an event emitter and accept an optional callback that fires once the
underlying emitter emits an `end` event or raises an error.

This allows for succinct code, that chains multiple methods (hello
[demeter](http://en.wikipedia.org/wiki/Law_of_Demeter)) synchronously and
waits until the asynchronous operations finish, a behaviour that closely
resembles promises and deferreds

Most operations start from the [repository](doc/api/repository.md) class.
Once instantiated the repository tries to resolve it's `.git` directory and
– it its not a "bare" repository – the work tree.

[semver]: http://semver.org "Semantic Versioning 2.0.0"
[events]: http://nodejs.org/api/events.html "nodejs.org/api: Events"
[stream]: http://nodejs.org/api/stream.html "nodejs.org/api: Stream"

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
