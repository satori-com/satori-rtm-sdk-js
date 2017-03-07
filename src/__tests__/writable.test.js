/* eslint-disable vars-on-top */

jest.mock('../websocket.js');

var h = require('./helper.js');

describe('checks the writable flag', function () {
  var p;
  var channel;

  beforeEach(function () {
    p = h.pipeline();
    channel = h.channel();
  });

  afterEach(function () {
    h.teardown();
  });

  it('checks bufferedAmount property', function (done) {
    var client = h.rtm(h.config.endpoint, h.config.appkey);

    client.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));
    client.on('change-writability', function (isWritable) {
      p.doCheck('writable-' + isWritable.toString());
    });

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connected');
      expect(client.writable).toBe(true);
      client.publish(channel, 'overflow-buffer-size');
    });

    p.addCheck(function (msg) {
      expect(msg).toBe('writable-false');
      expect(client.ws.bufferedAmount).toBeGreaterThan(client.options.highWaterMark);
      expect(client.writable).toBe(false);

      client.publish(channel, 'reset-buffer-size');
    });

    p.addCheck(function (msg) {
      expect(msg).toBe('writable-true');
      expect(client.ws.bufferedAmount).toBeLessThan(client.options.highWaterMark);
      expect(client.writable).toBe(true);
    });

    p.whenCompleted(done);

    client.start();
  });
});
