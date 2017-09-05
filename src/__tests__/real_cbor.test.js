/* eslint-disable vars-on-top */

jest.useRealTimers();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var h = require('./helper.js');
var RTM = require('../rtm.js');

describe('cbor encoding', function () {
  var channel;
  var typedMessages;

  beforeEach(function () {
    channel = h.channel();

    var binary = new ArrayBuffer(8);
    var uint8s = new Uint8Array(binary);
    for (var i = 0; i < 8; i += 1) {
      uint8s[i] = 42;
    }

    typedMessages =
    [
      null, 42, 3.141599999999999, 'Сообщение',
      [], {},
      true, false,
      'the last message',
      uint8s,
      ['message', null],
      ['message', null, uint8s],
      { key: 'value', key2: null },
      { key: 'value', key2: uint8s },
    ];
  });

  afterEach(function () {
    h.teardown();
  });

  it('publish and receives different data types', function (done) {
    var rtm = h.rtm(null, null, { protocol: 'cbor' });
    var subscription = rtm.subscribe(channel, RTM.SubscriptionMode.SIMPLE);
    var idx = 0;
    subscription.on('rtm/subscription/data', function (pdu) {
      pdu.body.messages.forEach(function (message) {
        expect(message).toEqual(typedMessages[idx]);
        idx += 1;
      });
      if (idx === typedMessages.length) {
        done();
      }
    });
    subscription.on('enter-subscribed', function () {
      expect(rtm.ws.protocol).toEqual('cbor');
      typedMessages.forEach(function (msg) {
        rtm.publish(channel, msg);
      });
    });
    rtm.start();
  });
});
