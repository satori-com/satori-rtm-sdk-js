/* eslint-disable vars-on-top */

jest.mock('../websocket.js');
jest.useRealTimers();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var RTM = require('../rtm.js');
var h = require('./helper.js');

describe('real client', function () {
  var p;
  var channel;

  beforeEach(function () {
    p = h.pipeline();
    channel = h.channel();
  });

  afterEach(function () {
    h.teardown();
  });

  it('gets subscription position and subscribes from this position', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connected', function () {
      rtm.publish(channel, 'message-1', p.doCheck);
      rtm.publish(channel, 'message-2');
    });
    rtm.start();

    p.addCheck(function (subscribeReply) {
      var subscription;
      var position = subscribeReply.body.position;
      expect(position).not.toBe(null);
      subscription = rtm.subscribe(channel, RTM.SubscriptionMode.RELIABLE, {
        position: position,
      });
      subscription.on('rtm/subscription/data', function (pdu) {
        pdu.body.messages.forEach(p.doCheck);
      });
    });
    p.addCheck(h.eq('message-1'));
    p.addCheck(h.eq('message-2'));
    p.whenCompleted(done);
  });

  it('stops client in callback', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connecting', p.doCheck.bind(this, 'enter-connecting'));
    rtm.on('enter-stopped', p.doCheck.bind(this, 'enter-stopped'));

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connecting');
      rtm.stop();
    });
    // expect that client stops again
    p.addCheck(h.eq('enter-stopped'));
    p.whenCompleted(done);

    rtm.start();
  });

  it('reconnects and resubscribes when disconnects unexpectedly', function (done) {
    var rtm = h.rtm();
    rtm.start();
    var subscription = rtm.subscribe(channel, RTM.SubscriptionMode.RELIABLE);
    subscription.on('enter-subscribed', p.doCheck.bind(this, 'enter-subscribed'));
    subscription.on('leave-subscribed', p.doCheck.bind(this, 'leave-subscribed'));
    p.addCheck(function (msg) {
      expect(msg).toBe('enter-subscribed');
      rtm.publish(channel, 'emulate-disconnect');
    });
    p.addCheck(h.eq('leave-subscribed'));
    p.addCheck(h.eq('enter-subscribed'));
    p.whenCompleted(done);
  });

  it('throws error when url is invalid', function (done) {
    var rtm = h.rtm('foobar', 'appkey');
    rtm.on('error', p.doCheck);
    p.addCheck(function (e) {
      expect(e.message).toBe('invalid url');
    });
    p.whenCompleted(done);
    rtm.start();
  });

  it('throws error when host is invalid', function (done) {
    var rtm = h.rtm('ws://foobar/', 'appkey');
    rtm.on('error', p.doCheck);
    p.addCheck(function (e) {
      expect(e.message).toBe('getaddrinfo ENOTFOUND foobar foobar:80');
    });
    p.whenCompleted(done);
    rtm.start();
  });

  it('fires client callbacks', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-stopped', p.doCheck.bind(null, 'enter-stopped'));
    rtm.on('leave-stopped', p.doCheck.bind(null, 'leave-stopped'));
    rtm.on('enter-connecting', p.doCheck.bind(null, 'enter-connecting'));
    rtm.on('leave-connecting', p.doCheck.bind(null, 'leave-connecting'));
    rtm.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));
    rtm.on('leave-connected', p.doCheck.bind(null, 'leave-connected'));
    rtm.on('enter-awaiting', p.doCheck.bind(null, 'enter-awaiting'));
    rtm.on('leave-awaiting', p.doCheck.bind(null, 'leave-awaiting'));

    p.addCheck(h.eq('leave-stopped'));
    p.addCheck(h.eq('enter-connecting'));
    p.addCheck(h.eq('leave-connecting'));
    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connected');
      rtm.publish(channel, 'emulate-disconnect');
    });
    p.addCheck(h.eq('leave-connected'));
    p.addCheck(h.eq('enter-awaiting'));
    p.addCheck(h.eq('leave-awaiting'));
    p.addCheck(h.eq('enter-connecting'));
    p.addCheck(h.eq('leave-connecting'));
    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connected');
      rtm.stop();
    });
    p.addCheck(h.eq('leave-connected'));
    p.addCheck(h.eq('enter-stopped'));
    p.whenCompleted(done);
    rtm.start();
  });

  it('continues work when exception is happened in callback', function (done) {
    var rtm = h.rtm();
    rtm.on('enter-connecting', function () {
      throw new Error('Runtime error');
    });
    var s = rtm.subscribe(channel, RTM.SubscriptionMode.RELIABLE);
    s.on('rtm/subscription/data', function (pdu) {
      pdu.body.messages.forEach(p.doCheck);
    });
    rtm.on('enter-connected', function () {
      rtm.publish(channel, 'text');
    });

    p.addCheck(h.eq('text'));
    p.whenCompleted(done);

    rtm.start();
  });

  it('should subscribe the same filter but with different subscription_id', function () {
    var rtm = h.rtm();
    var filter = 'select * from test-channel';
    var subId1 = h.subscriptionId();
    var subId2 = h.subscriptionId();

    rtm.on('enter-connected', function () {
      var subscription = rtm.subscribe(subId1, RTM.SubscriptionMode.SIMPLE, {
        filter: filter,
      });
      subscription.on('enter-subscribed', function () {
        p.doCheck('subscribed', this);
      });

      var subscription2 = rtm.subscribe(subId2, RTM.SubscriptionMode.SIMPLE, {
        filter: filter,
      });
      subscription2.on('enter-subscribed', function () {
        p.doCheck('subscribed2', this);
      });

      p.addCheck(function (action, sub) {
        expect(action).toBe('subscribed');
        expect(sub.subscriptionId).toBe(subId1);
      });
      p.addCheck(function (action, sub) {
        expect(action).toBe('subscribed2');
        expect(sub.subscriptionId).toBe(subId2);
      });
    });
    rtm.start();
  });

  it('append version correctly', function () {
    var rtm = h.rtm();

    expect(rtm._appendVersion('wss://foo.com/')).toBe('wss://foo.com/v2');
    expect(rtm._appendVersion('wss://foo.com')).toBe('wss://foo.com/v2');
    expect(rtm._appendVersion('wss://foo.com/v2')).toBe('wss://foo.com/v2');
  });
});
