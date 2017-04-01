/* eslint-disable vars-on-top */

jest.mock('../websocket.js');
jest.useRealTimers();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var RTM = require('../rtm.js');
var h = require('./helper.js');

describe('real subscription', function () {
  var p;
  var subscriptionId;

  beforeEach(function () {
    p = h.pipeline();
    subscriptionId = h.subscriptionId();
  });

  afterEach(function () {
    h.teardown();
  });

  it('subscribes with incorrect position and resubscribes without position', function (done) {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.RELIABLE, {
      position: 'invalid_position',
    });

    s.on('rtm/subscribe/error', function () {
      rtm.resubscribe(subscriptionId, RTM.SubscriptionMode.RELIABLE, {}, function (newSub) {
        p.doCheck('resubscribe', newSub);
      });
    });
    s.on('data', p.doCheck);

    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('rtm/subscribe/error');
      expect(pdu.body.error).toBe('invalid_format');
    });
    p.addCheck(function (action, newS) {
      expect(action).toBe('resubscribe');
      expect(newS).not.toBe(s);
      expect(newS.subscriptionId).toBe(subscriptionId);
      expect(newS.handlers).toBe(s.handlers);
    });
    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('rtm/subscribe/ok');
    });
    p.whenCompleted(done);

    rtm.start();
  });

  it('resubscribes without position when tracking position is false', function (done) {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.SIMPLE);
    s.on('rtm/subscribe/ok', p.doCheck);
    p.addCheck(function (pdu) {
      var subscribePdu = s.subscribePdu();
      expect(subscribePdu.body.position).not.toBeDefined();
      expect(pdu.action).toBe('rtm/subscribe/ok');
    });
    p.whenCompleted(done);
    rtm.start();
  });

  it('resubscribes and changes the subscription object', function (done) {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.SIMPLE);
    s.on('rtm/subscribe/ok', p.doCheck);
    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('rtm/subscribe/ok');
      expect(rtm.getSubscription(subscriptionId)).toBe(s);
      rtm.resubscribe(subscriptionId, RTM.SubscriptionMode.SIMPLE, {}, function (newS) {
        expect(newS).not.toBe(s);
        expect(rtm.getSubscription(subscriptionId)).toBe(newS);
        p.doCheck('resubscribed');
      });
    });
    p.addCheck(h.eq('resubscribed'));
    p.whenCompleted(done);
    rtm.start();
  });

  it('resubscribes without position but with other options after disconnect', function (done) {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.SIMPLE);
    s.on('rtm/subscribe/ok', p.doCheck);
    p.addCheck(function (pdu) {
      var request = s.subscribePdu(0);
      expect(request.body.fast_forward).toBe(true);
      expect(request.body.position).not.toBeDefined();
      expect(pdu.action).toBe('rtm/subscribe/ok');
    });
    p.whenCompleted(done);
    rtm.start();
  });

  it('gets subscription error', function (done) {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.ADVANCED);

    s.on('enter-subscribed', p.doCheck.bind(this, 'enter-subscribed'));
    s.on('leave-subscribed', p.doCheck.bind(this, 'leave-subscribed'));
    rtm.on('data', function (pdu) {
      if (pdu.action === 'rtm/subscription/error') {
        p.doCheck('subscription-error');
      }
    });

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-subscribed');
      rtm.publish(subscriptionId, {
        type: 'emulate-server-response',
        response: {
          action: 'rtm/subscription/error',
          body: {
            subscription_id: subscriptionId,
            error: 'out_of_sync',
            error_text: 'Too much traffic',
          },
        },
      });
    });
    p.addCheck(function (msg) {
      expect(msg).toBe('leave-subscribed');
      rtm.restart();
    });
    p.addCheck(h.eq('subscription-error'));
    p.addCheck(h.eq('enter-subscribed'));
    p.whenCompleted(done);

    rtm.start();
  });

  it('subscribes with filter and fast_forward', function () {
    var rtm = h.rtm();
    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.RELIABLE, {
      filter: 'select * from ' + subscriptionId,
    });
    var pdu = s.subscribePdu(0);
    expect(pdu.body.filter).toBe('select * from ' + subscriptionId);
    expect(pdu.body.fast_forward).toBe(true);
    expect(pdu.body.subscription_id).toBe(subscriptionId);
  });

  it('gets message when track position is true', function (done) {
    var subscriber = h.rtm();
    var publisher = h.rtm();

    var s = subscriber.subscribe(subscriptionId, RTM.SubscriptionMode.RELIABLE);
    s.on('enter-subscribed', p.doCheck.bind(this, 'enter-subscribed'));
    s.on('rtm/subscription/data', function (pdu) {
      pdu.body.messages.forEach(p.doCheck);
    });

    publisher.on('enter-connected', function () {
      publisher.publish(subscriptionId, 'message');
    });

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-subscribed');
      subscriber.stop();
      publisher.start();
      subscriber.start();
    });
    p.addCheck(h.eq('enter-subscribed'));
    p.addCheck(h.eq('message'));
    p.whenCompleted(done);

    subscriber.start();
  });

  it('publishes with complex object should work', function (done) {
    var rtm = h.rtm();

    var s = rtm.subscribe(subscriptionId, RTM.SubscriptionMode.RELIABLE);
    s.on('rtm/subscription/data', function (pdu) {
      pdu.body.messages.forEach(p.doCheck);
    });

    rtm.on('enter-connected', function () {
      rtm.publish(subscriptionId, { foo: 'bar' });
    });

    p.addCheck(function (msg) {
      expect(msg).toEqual({ foo: 'bar' });
    });
    p.whenCompleted(done);

    rtm.start();
  });
});
