var Observer = require('../observer.js');

describe('observer', function () {
  it('delivers events', function (done) {
    var observer = new Observer();
    observer.on('event', function () {
      done();
    });
    observer.fire('event');
  });

  it('receives event if two handlers are registered', function (done) {
    var observer = new Observer();
    var counter = 0;
    observer.on('event', function () {
      counter += 1;
    });
    observer.on('event', function () {
      if (counter === 1) {
        done();
      }
    });
    observer.fire('event');
  });

  it('deletes handlers when "off" is called', function () {
    var observer = new Observer();
    var counter = 0;
    var handler = function () {
      counter += 1;
    };
    observer.on('event', handler);
    observer.fire('event');
    observer.off('event', handler);
    observer.fire('event');
    expect(counter).toBe(1);
  });

  it('passes arguments to event handlers', function (done) {
    var observer = new Observer();
    var obj = {};
    observer.on('event', function (arg, str) {
      expect(arg).toBe(obj);
      expect(str).toBe('foobar');
      done();
    });
    observer.fire('event', obj, 'foobar');
  });
});
