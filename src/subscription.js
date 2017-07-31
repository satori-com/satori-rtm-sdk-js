var Observer = require('./observer.js');
var objectAssign = require('object-assign');

/**
 * Creates an instance of a subscription. This function inherits functions from
 * [Observer.js]{@link Observer}, such as [on(event, fn)]{@link Observer#on}
 * @class
 * @augments Observer
 *
 * @description
 * <code>Subscription</code> represents a subscription to a channel. Its functions manage the
 * subscription state and respond to subscription events.
 *
 * Use <code>Subscription</code> functions to specify code that executes when an event occurs or
 * when the subscription enters a specific state.
 *
 * For example, use <code>Subscription.on("rtm/subscription/data", fn())</code> to specify a
 * function that's executed when the subscription receives a message. Use
 * <code>Subscription.on("enter-subscribed", fn())</code> to specify a function that's executed
 * when the subscription is active.
 *
 * When your application receives a channel message, the <code>data</code> event occurs and the
 * message is passed as a Protocol Data Unit (<strong>PDU</strong>) to the function specified for
 * <code>Subscription.on("rtm/subscription/data", fn())</code>.
 *
 * You can also specify an event handler function that executes when the subscription enters or
 * leaves subscribed state. For example, to specify an event handler for the
 * <code>enter-subscribed</code> event, use <code>Subscription.on("enter-subscribed", fn()}</code>.
 *
 * <strong>Note:</strong> When the connection from the client to RTM drops, all subscriptions are
 * unsubscribed and then resubscribed when the connection is restored.
 *
 * @example
 * // Creates an RTM client
 * var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');
 * // create a new subscription to the channel named 'your-channel'
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
 * @param {string} subscriptionId - unique identifier for the subscription. If you don't use the
 * <code>filter</code> parameter to specify a streamview, subscriptionId is treated as a channel
 * name.
 *
 * @param {Object} opts - additional subscription options
 *
 * @param {boolean} [opts.mode] - subscription mode
 *
 * @param {object} [opts.bodyOpts={}]
 * Additional options for the subscription. These options are sent to RTM in the <code>body</code>
 * element of the PDU that represents the subscribe request.
 *
 * @throws {TypeError} indicates that mandatory parameters are missing or invalid.
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
