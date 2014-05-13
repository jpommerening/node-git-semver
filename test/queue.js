describe('queue', function () {

  describe('.exclusive(callback, done)', function () {
    var queue;

    it('enqueues executes given callback', function (done) {
      queue.exclusive(function (done) {
        done();
      }, done);
    });

  });


});
