var Observer = require('./observer.js');
var objectAssign = require('object-assign');

/**
 * Create a subscription instance.
 * @class
 * @augments Observer
 *
 * @description
 * The <code>Subscription</code> class manages the state and events of a
 * subscription.
 *
 * You can use the <code>Subscription</code> class to define application functionality
 * when specific events occur, like receiving a message, or when the subscription
 * enters different subscription state.
 *
 * When the application receives a message as subscription data, the <code>data</code>
 * event occurs and the received message is passed, as a Protocol Data Unit (PDU),
 * to the <code>fn</code> parameter of the
 * [Subscription.on(event, fn)]{@link Subscription#on} event handler method.
 *
 * Use the [Subscription.on(event, fn)]{@link Subscription#on} method to add an
 * event handler to the subscription, which 'fires' when the subscription
 * receives a published message. The event parameter in this method can take a
 * value of <code>data</code> or the value of the action element of the PDU,
 * for example, <code>rtm/subscription/data</code>.
 *
 * You can also set event handlers when the subscription enters or leaves
 * subscribed state: <code>enter-subscribed</code>, <code>leave-subscribed<code>.
 *
 * <strong>Note:</strong> When the connection from the RTM client to
 * RTM drops, all subscriptions are unsubscribed, and then resubscribed
 * when the connection is restored.
 *
 * @example
 * // create a new subscription to the 'your-channel' channel
 * var subscription = rtm.subscribe('your-channel');
 *
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 * subscription.on('enter-subscribed', function () {
 *     console.log('Subscribed!');
 * });
 * subscription.on('data', function (pdu) {
 *     if (pdu.action.endWith('/error')) {
 *         rtm.restart();
 *     }
 * });
 *
 * @param {string} subscriptionId - String that identifies the subscription. If you do not
 * use the <code>filter</code> parameter, it is treated as a channel name.
 *
 * @param {Object} opts - Additional subscription options.
 *
 * @param {boolean} [opts.mode] - Subscription mode.
 *
 * @param {object} [opts.bodyOpts={}]
 * Additional subscription options for a channel subscription. These options
 * are sent to RTM in the <code>body</code> element of the PDU that represents the subscribe
 * request.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 */
function Subscription(subscriptionId, _opts) {
  if (typeof subscriptionId !== 'string') {
    throw new TypeError('"subscriptionId" is missing or invalid');
  }
  Observer.call(this);

  this.options = objectAssign({}, _opts);
  if (typeof this.options.bodyOpts !== 'object') {
    this.options.bodyOpts = {};
  }
  if (this.options.fastForward) {
    this.options.bodyOpts.fast_forward = true;
  }

  this.position = null;
  this.subscriptionId = subscriptionId;
  this.wasSubscribedAtLeastOnce = false;
  this.isSubscribed = false;
  /* eslint-enable camelcase */
}

Subscription.prototype = Object.create(Observer.prototype);

Subscription.prototype.subscribePdu = function (id) {
  var body;

  // inherit all users options like 'filter', 'fast_forward'
  if (this.options.bodyOpts.filter) {
    body = { subscription_id: this.subscriptionId };
  } else {
    body = { channel: this.subscriptionId };
  }

  body = objectAssign(body, this.options.bodyOpts);

  if (this.wasSubscribedAtLeastOnce) {
    if (this.position !== null) {
      body.position = this.position;
    } else {
      delete body.position;
    }
  }
  return {
    id: id,
    action: 'rtm/subscribe',
    body: body,
  };
};

Subscription.prototype.unsubscribePdu = function (id) {
  return {
    id: id,
    action: 'rtm/unsubscribe',
    body: { subscription_id: this.subscriptionId },
  };
};

Subscription.prototype.onPdu = function (pdu) {
  var body = pdu.body;
  if (body && body.position) {
    this._onPosition(body.position);
  }
  if (pdu.action === 'rtm/subscribe/ok') {
    this.isSubscribed = true;
    this.wasSubscribedAtLeastOnce = true;
    this.fire('enter-subscribed');
  }
  if (pdu.action === 'rtm/unsubscribe/ok') {
    this._markAsUnsubscribed();
  }
  if (pdu.action === 'rtm/subscription/error') {
    this._markAsUnsubscribed();
  }
  this.fire('data', pdu, this);
  this.fire(pdu.action, pdu, this);
};

Subscription.prototype.onDisconnect = function () {
  this._markAsUnsubscribed();
};

Subscription.prototype._onPosition = function (position) {
  if (this.options.trackPosition) {
    this.position = position;
  }
  this.fire('position', position, this);
};

Subscription.prototype._markAsUnsubscribed = function () {
  if (this.isSubscribed) {
    this.isSubscribed = false;
    this.fire('leave-subscribed');
  }
};

module.exports = Subscription;
