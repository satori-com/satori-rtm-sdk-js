var Subscription = require('../subscription.js');

function subscribeOk(id, subscriptionId, position) {
  return {
    id: id,
    action: 'rtm/subscribe/ok',
    body: {
      subscription_id: subscriptionId,
      position: position,
    },
  };
}

function subscriptionData(subscriptionId, position) {
  return {
    action: 'rtm/subscription/data',
    body: {
      subscription_id: subscriptionId,
      position: position,
    },
  };
}

describe('subscription', function () {
  it('should check that `filter` option is not undefined when use subscription_id', function () {
    var subscription = new Subscription('channel', {
      bodyOpts: {
        filter: undefined,
      },
    });
    var pdu = subscription.subscribePdu(9);
    expect(pdu.action).toEqual('rtm/subscribe');
    expect(pdu.body).toEqual({
      channel: 'channel',
      filter: undefined,
    });
  });

  it('should pass bodyOpts to subscribe pdu', function () {
    var subscription = new Subscription('channel', {
      bodyOpts: {
        fast_forward: false,
        filter: 'fvalue',
        position: 'nvalue',
      },
    });
    var pdu = subscription.subscribePdu(9);
    expect(pdu.action).toEqual('rtm/subscribe');
    expect(pdu.id).toEqual(9);
    expect(pdu.body).toEqual({
      fast_forward: false,
      subscription_id: 'channel',
      filter: 'fvalue',
      position: 'nvalue',
    });
  });

  it('should supplement bodyOpts with default options when bodyOpts is specified', function () {
    var subscription = new Subscription('channel', {
      fastForward: true,
      bodyOpts: { filter: 'fvalue' },
    });
    var pdu = subscription.subscribePdu(0);
    expect(pdu.body).toEqual({
      subscription_id: 'channel',
      fast_forward: true,
      filter: 'fvalue',
    });
  });

  it('should pass default bodyOpts when no opts is specified', function () {
    var subscription = new Subscription('channel');
    var pdu = subscription.subscribePdu(0);
    expect(pdu.body).toEqual({ channel: 'channel' });
  });


  it('should change internal state during onPdu', function () {
    var subscription = new Subscription('channel', {
      trackPosition: true,
      fastForward: true,
    });
    var pdu;
    subscription.onPdu(subscribeOk(0, 'channel', 'position-0'));

    expect(subscription.isSubscribed).toBe(true);
    expect(subscription.position).toBe('position-0');
    expect(subscription.wasSubscribedAtLeastOnce).toBe(true);

    subscription.onPdu(subscriptionData('channel', 'position-1'));
    subscription.onDisconnect();

    expect(subscription.isSubscribed).toBe(false);
    expect(subscription.position).toBe('position-1');
    expect(subscription.wasSubscribedAtLeastOnce).toBe(true);

    pdu = subscription.subscribePdu(2);
    expect(pdu.action).toEqual('rtm/subscribe');
    expect(pdu.id).toEqual(2);
    expect(pdu.body).toEqual({
      channel: 'channel',
      fast_forward: true,
      position: 'position-1',
    });
  });

  it('should allow to work without trackPosition', function () {
    var subscription = new Subscription('channel', { fastForward: true });
    var pdu;
    subscription.onPdu(subscribeOk(0, 'channel', 'position-0'));
    subscription.onPdu(subscriptionData('channel', 'position-1'));
    pdu = subscription.subscribePdu(2);
    expect(pdu.body).toEqual({ channel: 'channel', fast_forward: true });
  });

  it('triggers position event', function (done) {
    var subscription = new Subscription('channel', { trackPosition: true });
    subscription.on('position', function (position, sub) {
      expect(position).toBe('position-0');
      expect(sub.position).toBe('position-0');
      expect(sub.subscriptionId).toBe('channel');
      done();
    });
    subscription.onPdu(subscribeOk(0, 'channel', 'position-0'));
  });

  it('should fire events', function (done) {
    var subscription = new Subscription('channel');
    subscription.on('rtm/subscribe/ok', function (pdu) {
      expect(pdu.body.subscription_id).toBe('channel');
      done();
    });
    subscription.onPdu(subscribeOk(0, 'channel', 'position-0'));
  });

  it('should use subscription_id when using filters', function () {
    var filter = 'select * from test-channel';
    var subscription = new Subscription('sub-id', { fast_forward: true, bodyOpts: { filter: filter } });
    var pdu = subscription.subscribePdu(0);
    expect(pdu.body.subscription_id).toEqual('sub-id');
    expect(pdu.body.filter).toEqual(filter);
  });
});
