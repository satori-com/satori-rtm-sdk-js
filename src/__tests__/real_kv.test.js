/* eslint-disable vars-on-top */

jest.mock('../websocket.js');
jest.useRealTimers();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var h = require('./helper.js');

describe('real key-value storage', function () {
  var p;
  var channel;

  beforeEach(function () {
    p = h.pipeline();
    channel = h.channel();
  });

  afterEach(function () {
    h.teardown();
  });

  it('reads correct value after publish', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connected', function () {
      // TODO: RTMv2 bug: when sending 3.1415 we got 3.141599999999999
      // Cut Pi number to 5 after plot.
      var messages =
        [null, 42, 3.141599999999999, 'Сообщение',
          [], {}, true, false,
          'the last message',
          ['message', null], { key: 'value', key2: null }];

      function checkMessages(ms) {
        if (ms.length === 0) {
          done();
          return;
        }
        var message = ms[0];
        rtm.publish(channel, message, function () {
          rtm.read(channel, function (pdu) {
            expect(pdu.body.message).toEqual(message);
            checkMessages(ms.slice(1));
          });
        });
      }
      // TODO: RTMv2 bug: connection fail if read from non-existing channel
      rtm.delete(channel, function () {
        checkMessages(messages);
      });
    });
    rtm.start();
  });

  it('reads correct value with additional options after publish', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connected', function () {
      rtm.publish(channel, 'value', function () {
        rtm.read(channel, {
          onAck: function (pdu) {
            expect(pdu.body.message).toEqual('value');
            done();
          },
        });
      });
    });
    rtm.start();
  });

  it('reads correct value after two writes', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));
    rtm.start();

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connected');
      rtm.write(channel, 'value1', p.doCheck.bind(null, 'write-value1'));
    });
    p.addCheck(function (msg) {
      expect(msg).toBe('write-value1');
      rtm.write(channel, 'value2', p.doCheck.bind(null, 'write-value2'));
    });
    p.addCheck(function (msg) {
      expect(msg).toBe('write-value2');
      rtm.read(channel, p.doCheck);
    });
    p.addCheck(function (pdu) {
      expect(pdu.body.message).toEqual('value2');
    });
    p.whenCompleted(done);
  });

  it('works correctly when do write - delete - read operations', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connected', function () {
      // TODO: RTMv2 bug: unable to read from non-existing channel. Need to remove
      // delete after fix.
      rtm.delete(channel, function () {
        rtm.read(channel, p.doCheck);
      });
    });

    p.addCheck(function (pdu) {
      expect(pdu.body.message).toEqual(null);
      rtm.write(channel, 'value', p.doCheck.bind(null, 'write-value'));
    });
    p.addCheck(function (msg) {
      expect(msg).toBe('write-value');
      rtm.read(channel, p.doCheck);
    });
    p.addCheck(function (pdu) {
      expect(pdu.body.message).toEqual('value');
      rtm.delete(channel, p.doCheck);
    });
    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('rtm/delete/ok');
      rtm.read(channel, p.doCheck);
    });
    p.addCheck(function (pdu) {
      expect(pdu.body.message).toEqual(null);
    });
    p.whenCompleted(done);

    rtm.start();
  });

  xit('searches channels', function (done) {
    var rtm = h.rtm();
    var channels = [];

    var initNChannels = function (n, completeFn) {
      var idx = n;
      if (n >= 0) {
        rtm.write(channel + idx, 'foo', function () {
          initNChannels(n - 1, completeFn);
        });
      } else {
        completeFn();
      }
    };


    rtm.on('enter-connected', function () {
      initNChannels(10, function () {
        rtm.search(channel, function (pdu) {
          channels = channels.concat(pdu.body.channels);
          expect(pdu.action).not.toBe('rtm/search/error');
          if (pdu.action === 'rtm/search/ok') {
            expect(channels.indexOf(channel + '5')).not.toBe(-1);
            done();
          }
        });
      });
    });

    rtm.start();
  });
});
