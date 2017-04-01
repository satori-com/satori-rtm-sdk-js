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
 * enters different subscription state machine state.
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
 * a state in the subscription state machine. A subscription can be in
 * one of the following states: <code>subscribing</code>, <code>subscribed</code>,
 * <code>unsubscribing</code>, <code>unsubscribed</code>, or <code>failed</code>.
 *
 * See
 * <strong>State Machines</strong> in the online docs.
 *
 * <strong>Note:</strong> When the connection from the RTM client to
 * RTM drops, all subscriptions are unsubscribed, and then resubscribed
 * when the connection is restored. You can direct the JavaScript SDK to automatically
 * reconnect or you can detect the disconnect manually and then reconnect to
 * RTM at the proper message stream position with the
 * <code>position</code> parameter.
 *
 * @example
 * // create a new subscription to the 'your-channel' channel
 * var subscription = rtm.subscribe('your-channel');
 *
 *
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 * subscription.on('enter-subscribed', function () {
 *     rtm.publish('your-channel', {type: 'init'});
 * });
 * subscription.on('data', function (pdu) {
 *     if (pdu.action.endWith('/error')) {
 *         rtm.restart();
 *     }
 * });
 *
 * @param {string} subscriptionId - String that identifies the channel. If you do not
 * use the <code>filter</code> parameter, it is the channel name. Otherwise,
 * it is a unique identifier for the channel (subscription id).
 *
 * @param {Object} opts - Additional subscription options.
 *
 * @param {boolean} [opts.mode]
 * Sets subscription mode. Can be <code>SIMPLE</code>, <code>RELIABLE</code>, or
 * <code>ADVANCED</code>.
 *
 * @param {object} [opts.bodyOpts={}]
 * Additional subscription options for a channel subscription. These options
 * are sent to RTM in the <code>body</code> element of the PDU that represents the subscribe
 * request.
 *
 * For more information about the <code>body</code> element of a PDU,
 * see <em>RTM API</em> in the online docs.
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
