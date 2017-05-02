var W3CWebSocket = require('./websocket.js');
var Observer = require('./observer.js');
var Subscription = require('./subscription.js');
var logger = require('./logger.js');
var auth = require('./auth.js');
var objectAssign = require('object-assign');
var CMap = require('./map.js');

var RTM_VER = 'v2';
var STOPPED = 'stopped';
var CONNECTING = 'connecting';
var CONNECTED = 'connected';
var AWAITING = 'awaiting';
var STATES = {};


/**
 * Create a RTM client instance.
 * @class
 * @augments Observer
 *
 * @description
 * The <code>RTM</code> class is the main entry point to manage the
 * WebSocket connection from the JavaScript SDK to RTM.
 *
 * Use the RTM class to create a client instance from which you can
 * publish messages and subscribe to channels. Create separate
 * [Subscription]{@link Subscription} objects for each channel to
 * which you want to subscribe.
 *
 * Use the [publish(channel, message, onAck)]{@link RTM#publish}
 * method to publish messages and either the
 * [Subscription.on(name, fn)]{@link Subscription#on} or
 * [RTM.on(name, fn)]{@link RTM#on} methods to process incoming messages.
 *
 * A state machine for the client defines the status of the client instance.
 * A client instance can be in one of the following states: <code>stopped</code>,
 * <code>connecting</code>, <code>connected</code>, or code>awaiting</code>.
 *
 * Each client event occurs when the client enters or leaves a state. Use the
 * RTM.on(name, fn)]{@link RTM#on} method to define logic for when the client
 * transitions into or out of a state. See
 * <strong>State Machines</strong> in the online docs.
 *
 *
 * @example
 * // create an RTM client
 * var rtm = new RTM('ENDPOINT', 'APPKEY');
 *
 * // create a new subscription with 'your-channel' name
* var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);
 *
 * // add subscription data handlers
 *
 * // the subscription receives any published message
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 *
 * // the client enters 'connected' state
 * rtm.on('enter-connected', function () {
 *   rtm.publish('your-channel', {key: 'value'});
 * });
 *
 * // the client receives any PDU - PDU is passed as a parameter
 * rtm.on('data', function (pdu) {
 *   if (pdu.action.endsWith('/error')) {
 *     rtm.restart();
 *   }
 * });
 *
 * // start the client
 * rtm.start();
 *
 * @param {string} endpoint - Endpoint for RTM.
 * Available from the Dev Portal.
 *
 * @param {string} appkey - Appkey used to access RTM.
 * Available from the Dev Portal.
 *
 * @param {object} opts - Additional parameters for the RTM client instance.
 *
 * @param {integer} [opts.minReconnectInterval=1000] - Minimum
 * time period, in milliseconds, to wait between reconnection attempts.
 *
 * @param {integer} [opts.maxReconnectInterval=120000] - Maximum
 * time period, in milliseconds, to wait between reconnection attempts.
 *
 * @param {boolean} [opts.heartbeatEnabled=true] - Enables periodic
 * heartbeat monitoring for the WebSocket connection.
 *
 * @param {object} [opts.authProvider] - Provider that manages
 * authentication for the RTM client.
 *
 * @param {integer} [opts.heartbeatInterval=60000] - Interval,
 * in milliseconds, to wait between heartbeat messages.
 *
 *
 * @param {integer} [opts.highWaterMark=4194304] - 4MB. High water mark,
 * in bytes, of the WebSocket write buffer. If the number of bytes queued in the
 * WebSocket write buffer exceeds this value, the SDK sets
 * [writeable]{@link RTM#writeable} to <code>false</code>.
 *
 * @param {integer} [opts.lowWaterMark=2097152] - 2MB. Low water mark,
 * in bytes, of the WebSocket write buffer. If the buffer rises above
 * <code>highWaterMark</code> and then drops below <code>lowWaterMark</code>,
 * the SDK sets [writeable]{@link RTM#writeable} to <code>true</code>.
 *
 * @param {integer} [opts.checkWritabilityInterval=100] - Interval,
 * in milliseconds, to check the queue length and update the <code>writable</code>
 * property as necessary.
 *
 * @property {boolean} writable
 * Indicates if the queue length in the WebSocket write buffer, in bytes,
 * is lower than the <code>highWaterMark</code> value.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 */
function RTM(endpoint, appkey, opts) {
  if (typeof endpoint !== 'string') {
    throw new TypeError('"endpoint" is missing or invalid');
  }
  if (typeof appkey !== 'string') {
    throw new TypeError('"appkey" is missing or invalid');
  }
  // superclass constructor call
  Observer.call(this);
  this.options = objectAssign({
    minReconnectInterval: 1000,
    maxReconnectInterval: 120000,
    heartbeatInterval: 60000,
    heartbeatEnabled: true,
    highWaterMark: 1024 * 1024 * 4, // 4Mb is the maximum queue length. Writable flag sets to false
    lowWaterMark: 1024 * 1024 * 2, // 2Mb unblock the writing. Writable flag sets to true
    checkWritabilityInterval: 100,
  }, opts);
  this.endpoint = this._appendVersion(endpoint) + '?appkey=' + appkey;
  this.reconnectCount = 0;
  this.lastId = 0;
  this.ws = null;
  this.reconnectTimer = null;
  this.subscriptions = {};
  this.ackCallbacks = new CMap();
  this.maskMessage = !this._isEndpointSecure(endpoint);

  if (this.options.heartbeatEnabled) {
    this._initHeartbeatInterval();
  }
  this.writable = true;
  this._initWritableState();
  this._initConnectionFSM();
  this.on('error', logger.error);
}

RTM.logger = logger;

/**
 * @typedef SubscriptionMode
 * @type {object}
 *
 * @property {boolean} trackPosition
 * Tracks the stream position received from RTM. RTM includes the <code>position</code>
 * parameter in responses to publish and subscribe requests and in subscription data messages.
 * The SDK can attempt to resubscribe to the channel data stream from this position.
 *
 * @property {boolean} fastForward
 * RTM fast-forwards the subscription when the SDK resubscribes to a channel.
 */

/**
 * Subscription modes.
 *
 * @namespace
 * @readonly
 */

RTM.SubscriptionMode = {
  /**
   * The JavaScript SDK
   * tracks the <code>position</code> parameter and attempts to use that value when
   * resubscribing. If the <code>position</code> parameter is expired, RTM fast-forwards
   * to the earliest possible <code>position</code> value.
   *
   * This option may result in missed messages if the application has a slow connection
   * to RTM and cannot keep up with the channel message data sent from RTM.
   *
   * For more information about the fast-forward feature, see <em>RTM API</em> in the online docs.
   *
   * @type {SubscriptionMode}
   * @static
   * @constant
   * @readonly
   */
  RELIABLE: {
    trackPosition: true,
    fastForward: true,
  },

  /**
   * The JavaScript SDK does not track the <code>position</code> parameter received from RTM.
   * Instead, when resubscribing following a reconnection, RTM fast-forwards to
   * the earliest possible <code>position</code> parameter value.
   *
   * This option may result in missed messages during reconnection if the application has
   * a slow connection to RTM and cannot keep up with the channel message stream sent from RTM.
   *
   * For more information about the fast-forward feature, see <em>RTM API</em> in the online docs.
   *
   * @type {SubscriptionMode}
   * @static
   * @constant
   * @readonly
   */
  SIMPLE: {
    trackPosition: false,
    fastForward: true,
  },

  /**
   * The JavaScript SDK tracks the <code>position</code> parameter and always uses that value when
   * resubscribing.
   *
   * If the stream position is expired when the SDK attempts to resubscribe, RTM
   * sends an <code>expired_position</code> error and unsubscribes.
   *
   * If the application has
   * a slow connection to RTM and cannot keep up with the channel message data sent from RTM,
   * RTM sends an <code>out_of_sync</code> error and unsubscribes.
   *
   * For more information about the <code>expired_position</code> and <code>out_of_sync</code>
   * errors, see <em>RTM API</em> in the online docs.
   *
   * @type {SubscriptionMode}
   * @static
   * @constant
   * @readonly
   */
  ADVANCED: {
    trackPosition: true,
    fastForward: false,
  },
};

/**
 * Creates an authentication provider for the the role-based authentication
 * method.
 *
 * The role-based authentication method is a two-step authentication process
 * based on the HMAC process, using the MD5 hashing routine:
 * <ul>
 * <li>The client obtains a nonce from the server in a handshake request.</li>
 * <li>The client then sends an authorization request with its role secret key
 * hashed with the received nonce.</li>
 * </ul>
 * <br>
 * Obtain a role secret key from the Dev Portal for your application.
 *
 * @param {string} role - User role to authenticate with.
 *
 * @param {string} roleSecret - Role secret key from Dev Portal.
 *
 * @param {object} opts - Additional authentication options.
 *
 * @param {integer} [opts.timeout=30000] - Amount of time, in milliseconds, before the
 * authentication operation times out.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {function} Authentication provider for the role-based authentication method.
 */
RTM.roleSecretAuthProvider = function (role, roleSecret, opts) {
  return auth.roleSecretAuthProvider(role, roleSecret, opts);
};
RTM.prototype = Object.create(Observer.prototype);

/**
 * Starts the client.
 *
 * The client begins to establish the WebSocket connection
 * to RTM and then tracks the state of the connection. If the WebSocket
 * connection drops for any reason, the JavaScript SDK attempts to reconnect.
 *
 *
 * Use [RTM.on(name, fn)]{@link RTM#on} to define application functionality,
 * for example, when the application enters or leaves the
 * <code>connecting</code> or <code>connected</code> states.
 *
 * @return {void}
 */
RTM.prototype.start = function () {
  if (STOPPED !== this.state) {
    throw new Error('RTM is already started');
  }
  this.fire('start');
};

/**
 * Stops the client. The SDK begins to close the WebSocket connection and
 * does not start it again unless you call [start()]{@link RTM#start}.
 *
 * Use this method to explicitly stop all interaction with RTM.
 *
 * Use [RTM.on(name, fn)]{@link RTM#on} to define application functionality,
 * for example, when the application enters or leaves the <code>stopped</code> state.
 *
 * @return {void}
 */
RTM.prototype.stop = function () {
  if (STOPPED === this.state) {
    throw new Error('RTM is already stopped');
  }
  this.fire('stop');
};

/**
 * Restarts the client.
 *
 * @return {void}
 */
RTM.prototype.restart = function () {
  this.stop();
  this.start();
};

/**
 * Returns <code>true</code> if the RTM client is in the <code>stopped</code> state.
 *
 * @return {boolean}
 * <code>true</code> if the client is in the <code>stopped</code> state; false otherwise.
 */
RTM.prototype.isStopped = function () {
  return this.state === STOPPED;
};

/**
 * Returns <code>true</code> if the client is in the <code>connected</code> state.
 *
 * In this state, the WebSocket connection is established and any authentication
 * (if necessary) has successfully completed.
 *
 * @return {boolean}
 * <code>true</code> if the client is in the <code>connected</code> state; false otherwise.
 */
RTM.prototype.isConnected = function () {
  return this.state === CONNECTED;
};

/**
 * Returns a [Subscription]{@link Subscription} object for the associated subscription id.
 * The <code>Subscription</code> object must exist.
 *
 * @param {string} subscriptionId - Subscription id.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {Subscription} The [Subscription]{@link Subscription} object.
 */
RTM.prototype.getSubscription = function (subscriptionId) {
  if (typeof subscriptionId !== 'string') {
    throw new TypeError('"subscriptionId" is missing or invalid');
  }
  return this.subscriptions[subscriptionId];
};

/**
 * Creates a subscription to the specified channel.
 *
 * When you create a channel subscription, you can specify additional properties,
 * for example, add a filter to the subscription and specify the
 * behavior of the SDK when resubscribing after a reconnection.
 *
 * For more information about the options for a channel subscription,
 * see <strong>Subscribe PDU</strong> in the online docs.
 *
 * @param {string} channelOrSubId - String that identifies the channel. If you do not
 * use the <code>filter</code> parameter, it is the channel name. Otherwise,
 * it is a unique identifier for the channel (subscription id).
 *
 * @param {RTM.SubscriptionMode} mode
 * Subscription mode. This mode determines the behaviour of the Javascript
 * SDK and RTM when resubscribing after a reconnection.
 *
 * For more information about the options for a subscription,
 * see <strong>Subscribe PDU</strong> in the online docs.
 *
 * @param {object} [bodyOpts={}]
 * Additional subscription options for a channel subscription. These options
 * are sent to RTM in the <code>body</code> element of the
 * Protocol Data Unit (PDU) that represents the subscribe request.
 *
 * For more information about the <code>body</code> element of a PDU,
 * see <em>RTM API</em> in the online docs.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {Subscription} - Subscription object.
 *
 * @example
 * var rtm = new RTM('ENDPOINT', 'APPKEY');
 *
 * // create a subscription with 'your-channel' name
 * var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);
 *
 * // the subscription receives any published message
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 *
 * rtm.start();
 *
 * @example
 * var rtm = new RTM('your-endpoint', 'your-appkey');
 *
 * // subscribe to the channel named 'my-channel' using a filter
 * var subscription = rtm.subscribe('my-filter', RTM.SubscriptionMode.SIMPLE, {
 *   filter: 'SELECT * FROM my-channel WHERE object.param >= 1 OR object.id == 0',
 * });
 *
 * // receive messages published to the channel
 * subscription.on('rtm/subscription/data', function (pdu) {
 *   pdu.body.messages.forEach(console.log);
 * });
 *
 * // receive subscription data messages
 * subscription.on('data', function (pdu) {
 *   if (pdu.action.endsWith('/error')) {
 *     rtm.restart();
 *   }
 * });
 *
 * rtm.start();
 *
 * @see {@link RTM.SubscriptionMode.SIMPLE}
 * @see {@link RTM.SubscriptionMode.RELIABLE}
 * @see {@link RTM.SubscriptionMode.ADVANCED}
 */
RTM.prototype.subscribe = function (channelOrSubId, mode, bodyOpts) {
  var containsKeys = function (map, keys) {
    return keys.reduce(function (acc, k) {
      return acc && {}.hasOwnProperty.call(map, k);
    }, true);
  };
  var subscription;
  var pdu;
  var opts;
  var modeMandatoryKeys = ['fastForward', 'trackPosition'];

  if (typeof channelOrSubId !== 'string') {
    throw new TypeError('"channelOrSubId" is missing or invalid');
  }

  if (!(typeof mode === 'object') || !containsKeys(mode, modeMandatoryKeys)) {
    throw new TypeError('Subscription mode has incorrect value: ' + mode + '\n' +
                        'Mode should contains the following mandatory fields: ' + modeMandatoryKeys.join(', ') + '\n' +
                        'See also: RTM.SubscriptionMode.SIMPLE, RTM.SubscriptionMode.ADVANCED, RTM.SubscriptionMode.RELIABLE');
  }

  if (this.subscriptions[channelOrSubId]) {
    throw new Error('Cannot create subscription ' + subscription + ' twice');
  }

  opts = objectAssign({}, mode, { bodyOpts: bodyOpts });
  subscription = new Subscription(channelOrSubId, opts);
  this.subscriptions[channelOrSubId] = subscription;
  if (this.isConnected()) {
    pdu = subscription.subscribePdu(this._nextId());
    this._send(pdu, function (sp) {
      subscription.onPdu(sp);
    });
  }
  return subscription;
};

/**
 * Updates an existing [Subscription]{@link Subscription} object. All event
 * handlers are copied to the updated object.
 *
 * Use this method to change an existing subscription, for example,
 * to add or change a filter.
 *
 * @param {string} channelOrSubId - Subscription id or channel name of
 * the existing subscription.
 *
 * @param {Object} opts
 * Properties for the updated <code>Subscription</code> object. See
 * [RTM.subscribe(channelOrSubId, opts)]{@link RTM#subscribe} and the
 * <em>RTM API</em> in the online docs for the supported property names.
 *
 * @param {Function} [onCompleted]
 * Function to execute on the updated <code>Subscription</code> object, passed
 * as a parameter.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.resubscribe = function (channelOrSubId, mode, bodyOpts, onCompleted) {
  var self = this;
  var prevSub;
  var newSub;
  if (typeof channelOrSubId !== 'string') {
    throw new TypeError('"channelOrSubId" is missing or invalid');
  }
  prevSub = self.subscriptions[channelOrSubId];
  self.unsubscribe(channelOrSubId, function () {
    newSub = self.subscribe(channelOrSubId, mode, bodyOpts);
    newSub.handlers = prevSub.handlers;
    if (onCompleted) {
      onCompleted(newSub);
    }
  });
};


/**
 * Removes the specified subscription.
 *
 * The response Protocol Data Unit (PDU) from the RTM is
 * passed as a parameter to the <code>onAck</code> function.
 *
 * For more information, see <strong>Unsubscribe PDU</strong> in the
 * online docs.
 *
 * @param {string} subscriptionId - Subscription id or channel name.
 *
 * @param {Function} [onAck]
 * Function to execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.unsubscribe = function (subscriptionId, onAck) {
  var self = this;
  var sub;
  var onUnsubscribed;
  var pdu;
  if (typeof subscriptionId !== 'string') {
    throw new TypeError('"subscriptionId" is missing or invalid');
  }
  sub = self.subscriptions[subscriptionId];
  if (!sub) {
    throw new Error('Unknown subscription ' + subscriptionId);
  }
  // This method is called when rtm/unsubscribe/(ok|error) is returned.
  // If subscription is not subscribed (e.g. client is disconnected)
  // then this method is called immediately without argument.
  onUnsubscribed = function (unsubscribeReplyPdu) {
    if (unsubscribeReplyPdu) {
      sub.onPdu(unsubscribeReplyPdu);
    }
    delete self.subscriptions[subscriptionId];
    if (onAck) {
      onAck(unsubscribeReplyPdu);
    }
  };
  if (sub.isSubscribed) {
    pdu = sub.unsubscribePdu(self._nextId());
    self._send(pdu, onUnsubscribed);
  } else {
    onUnsubscribed();
  }
};

/**
 * Publishes a message to a channel. The [RTM]{@link RTM} client
 * must be connected.
 *
 * @example
 * rtm.publish('channel', {key: 'value'}, function (pdu) {
 *   if (!pdu.action.endsWith('/ok')) {
 *     console.log('something went wrong');
 *   }
 * });
 *
 * @param {string} channel - Channel name.
 *
 * @param {JSON} message
 * JSON that represents the message payload to publish.
 *
 * @param {Function} [onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.publish = function (channel, message, onAck) {
  var command;
  if (typeof channel !== 'string') {
    throw new TypeError('"channel" is missing or invalid');
  }
  if (typeof message === 'undefined') {
    throw new TypeError('"message" is missing');
  }
  command = {
    action: 'rtm/publish',
    body: {
      channel: channel,
      message: message,
    },
  };
  return this._send(command, onAck);
};

/**
 * Reads the latest message written to a specific channel, as a Protocol
 * Data Unit (PDU). The [RTM]{@link RTM} client must be connected.
 *
 * @variation 1
 *
 * @param {string} channel - Channel name.
 *
 * @param {Function} [onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @example
 * rtm.read('channel', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 *
 * @also
 *
 * Reads the latest message written to specific channel, as a Protocol
 * Data Unit (PDU).
 * The [RTM]{@link RTM} client must be connected.
 *
 * @variation 2
 *
 * @param {string} channel - Channel name.
 *
 * @param {object} [opts={}]
 * Additional <code>body</code> options for the read PDU.
 * For more information, see <em>RTM API/em> in the online docs.
 *
 * @param {object} [opts.bodyOpts={}]
 * Additional read request options. These options are sent to
 * RTM in the <code>body</code> element of the
 * PDU that represents the read request.
 *
 * @param {Function} [opts.onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @example
 * rtm.read('channel', {
 *   bodyOpts: { position: '1485444476:0' },
 *   onAck: function (pdu) {
 *     console.log(pdu);
 *   }
 * })
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.read = function (channel, onAckOrOpts) {
  var command;
  var opts;
  if (typeof channel !== 'string') {
    throw new TypeError('"channel" is missing or invalid');
  }
  if (typeof onAckOrOpts === 'function') {
    opts = { onAck: onAckOrOpts };
  } else {
    opts = onAckOrOpts;
  }
  command = {
    action: 'rtm/read',
    body: objectAssign({}, opts.bodyOpts, { channel: channel }),
  };
  return this._send(command, opts.onAck);
};

/**
 * Writes a value to the specified channel. The [RTM]{@link RTM} client must be connected.
 *
 * @param {string} channel - Channel name.
 *
 * @param {JSON} value
 * JSON that represents the message payload to publish.
 *
 * @param {Function} [onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @example
 * rtm.write('channel', 'value', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.write = function (channel, value, onAck) {
  var command;
  if ((typeof channel !== 'string')) {
    throw new TypeError('"channel" is missing or invalid');
  }
  if (typeof value === 'undefined') {
    throw new TypeError('"value" is missing or invalid');
  }
  command = {
    action: 'rtm/write',
    body: { channel: channel, message: value },
  };
  return this._send(command, onAck);
};

/**
 * Deletes the value for the associated channel. The [RTM]{@link RTM} client must be connected.
 *
 * @param {string} channel - Channel name.
 *
 * @param {Function} [onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @example
 * rtm.delete('channel', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.delete = function (channel, onAck) {
  var command;
  if (typeof channel !== 'string') {
    throw new TypeError('"channel" is missing or invalid');
  }
  command = {
    action: 'rtm/delete',
    body: { channel: channel },
  };
  return this._send(command, onAck);
};

/**
 * Performs a channel search for a given user-defined prefix. This method passes
 * replies to the callback. The [RTM]{@link RTM} client must be connected.
 *
 * RTM may send multiple responses to the same search request: zero or
 * more search result PDUs with an action of <code>rtm/search/data</code>
 * (depending on the results of the search). Each channel found is only sent
 * once. After the search result PDUs, RTM follows with a positive response PDU:
 * <code>rtm/search/ok</code>.
 *
 * Otherwise, RTM sends an error PDU with an action of <code>rtm/search/error</code>.
 *
 * @param {string} prefix - Channel prefix.
 *
 * @param {Function} [onAck]
 * Function to attach and execute on the response PDU from
 * RTM. The response PDU is passed as a parameter to this function.
 * RTM does not send a response PDU if a callback is not specified.
 *
 * @example
 * var channels = [];
 * rtm.search('ch', function (pdu) {
 *     channels = channels.concat(pdu.body.channels);
 *     if (pdu.action === 'rtm/search/ok') {
 *       console.log(channels);
 *     }
 * })
 *
 * @throws {TypeError} <code>TypeError</code> indicates that mandatory
 * parameters are missing or invalid.
 *
 * @return {void}
 */
RTM.prototype.search = function (prefix, onAck) {
  var command;
  if (typeof prefix !== 'string') {
    throw new TypeError('"prefix" is missing or invalid');
  }
  command = {
    action: 'rtm/search',
    body: { prefix: prefix },
  };
  return this._send(command, onAck);
};

// Private methods

RTM.prototype._initHeartbeatInterval = function () {
  var self = this;
  var heartbeatTimer;
  var interval = this.options.heartbeatInterval;

  this.on('open', function () {
    var pingTimestamp = 0;
    var pongTimestamp = 0;
    heartbeatTimer = setInterval(function () {
      if (pongTimestamp < pingTimestamp) {
        self._disconnect();
        return;
      }
      pingTimestamp = Date.now();
      self.publish('$heartbeat', '', function () {
        pongTimestamp = Date.now();
      });
    }, interval);
  });

  this.on('close', function () {
    clearInterval(heartbeatTimer);
  });
};

RTM.prototype._initWritableState = function () {
  var self = this;
  var writableStateTimer;
  var interval = this.options.checkWritabilityInterval;

  this.on('open', function () {
    self._setWritableState(true);
    writableStateTimer = setInterval(function () {
      self._checkWritableState();
    }, interval);
  });

  this.on('close', function () {
    clearInterval(writableStateTimer);
    self._setWritableState(false);
  });
};

RTM.prototype._checkWritableState = function () {
  if (this.writable && this.ws.bufferedAmount > this.options.highWaterMark) {
    this._setWritableState(false);
  } else if (!this.writable && this.ws.bufferedAmount < this.options.lowWaterMark) {
    this._setWritableState(true);
  }
};

RTM.prototype._setWritableState = function (newState) {
  if (this.writable !== newState) {
    this.writable = newState;
    this.fire('change-writability', this.writable);
  }
};

RTM.prototype._connect = function () {
  var self = this;
  var ws;
  logger.debug('Connecting to', this.endpoint);
  ws = this.ws = new W3CWebSocket(this.endpoint, [], {
    perMessageDeflate: false,
  });
  ws.onopen = function () {
    self.fire('open');
  };
  ws.onmessage = function (message) {
    var json;
    try {
      logger.debug('recv<', message.data);
      json = JSON.parse(message.data);
      self._recv(json);
      self.fire('data', json);
    } catch (error) {
      self.fire('error', error);
    }
  };
  ws.onerror = function (error) {
    self.fire('error', error);
  };
  ws.onclose = function () {
    if (self.ws === ws) {
      self.ws = null;
      self.fire('close');
    }
  };
};

RTM.prototype._send = function (pdu, onAck) {
  if (!this.isConnected()) {
    throw new Error('Client is not connected');
  }
  return this._unsafeSend(pdu, onAck);
};

RTM.prototype._unsafeSend = function (origPdu, onAck) {
  var pdu = objectAssign({}, origPdu);
  var json;
  if (onAck) {
    pdu.id = 'id' in pdu ? pdu.id : this._nextId();
    this.ackCallbacks.set(pdu.id, onAck);
  }
  json = JSON.stringify(pdu);
  logger.debug('send>', json);
  try {
    this.ws.send(json, {
      mask: this.maskMessage,
    });
  } catch (error) {
    this.fire('error', error);
  }
  this._checkWritableState();
};

RTM.prototype._recv = function (pdu) {
  var subscriptionId;
  var subscription;
  var ack;
  // standalone versions because `startsWith` && `endsWith` appeared in ES6 only
  var startsWith = function (str, prefix) {
    return str.substr(0, prefix.length) === prefix;
  };
  var endsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };
  if (pdu.body && ('subscription_id' in pdu.body) && startsWith(pdu.action, 'rtm/subscription/')) {
    subscriptionId = pdu.body.subscription_id;
    subscription = this.subscriptions[subscriptionId];
    if (subscription) {
      subscription.onPdu(pdu);
    }
  }
  if ('id' in pdu) {
    ack = this.ackCallbacks.get(pdu.id);
    if (ack) {
      if (!endsWith(pdu.action, '/data')) {
        this.ackCallbacks.delete(pdu.id);
      }
      ack(pdu);
    }
  }
};

RTM.prototype._disconnect = function () {
  var ws = this.ws;
  if (ws) {
    ws.onclose();
    ws.onclose = null;
    ws.close();
  }
  this.ackCallbacks.clear();
};

RTM.prototype._nextId = function () {
  this.lastId += 1;
  return this.lastId;
};

RTM.prototype._nextReconnectInterval = function () {
  var THRESHOLD_FAIL_COUNT = 30;
  var minReconnectInterval = this.options.minReconnectInterval;
  var maxReconnectInterval = this.options.maxReconnectInterval;
  var jitter = Math.random() * this.options.minReconnectInterval;
  var count = Math.min(this.reconnectCount, THRESHOLD_FAIL_COUNT);
  var interval = Math.min(maxReconnectInterval,
      jitter + (minReconnectInterval * Math.pow(2, count)));
  return interval;
};

RTM.prototype._forEachSubscription = function (fn) {
  var self = this;
  Object.keys(self.subscriptions).forEach(function (subscriptionId) {
    if ({}.hasOwnProperty.call(self.subscriptions, subscriptionId)) {
      fn(subscriptionId, self.subscriptions[subscriptionId]);
    }
  });
};

RTM.prototype._subscribeAll = function () {
  var self = this;
  this._forEachSubscription(function (subscriptionId, subscription) {
    var pdu = subscription.subscribePdu(self._nextId());
    self._send(pdu, function (sp) {
      subscription.onPdu(sp);
    });
  });
};

RTM.prototype._disconnectAll = function () {
  this._forEachSubscription(function (subscriptionId, subscription) {
    subscription.onDisconnect();
  });
};

RTM.prototype._isEndpointSecure = function (endpoint) {
  if (endpoint.indexOf('wss://') === 0) {
    return true;
  }

  return false;
};

// Connection Finite State Machine
//
STATES[STOPPED] = {
  _enter: function () {
    this._disconnect();
  },
  _leave: function () {},
  start: function () {
    this._transition(CONNECTING);
  },
  close: function () {},
};
STATES[CONNECTING] = {
  _enter: function () {
    try {
      this._connect();
    } catch (e) {
      this.fire('error', e);
    }
  },
  _leave: function () {},
  open: function () {
    var self = this;
    var onsuccess;
    var onfail;
    this.lastId = 0;
    if (this.options.authProvider) {
      onsuccess = function () {
        self.fire('authenticated');
        self._transition(CONNECTED);
      };
      onfail = function (e) {
        self.fire('error', e);
      };
      this.options.authProvider(this, onsuccess, onfail);
    } else {
      this._transition(CONNECTED);
    }
  },
  error: function () {
    this._transition(AWAITING);
  },
  close: function () {
    this._transition(AWAITING);
  },
  stop: function () {
    this._transition(STOPPED);
  },
};

STATES[CONNECTED] = {
  _enter: function () {
    this.reconnectCount = 0;
    this._subscribeAll();
  },
  _leave: function () {
    this._disconnectAll();
  },
  close: function () {
    this._transition(AWAITING);
  },
  stop: function () {
    this._transition(STOPPED);
  },
};

STATES[AWAITING] = {
  _enter: function () {
    var self = this;
    var interval;
    this._disconnect();
    interval = this._nextReconnectInterval();
    this.reconnectTimer = setTimeout(function () {
      self.reconnectCount += 1;
      self._transition(CONNECTING);
    }, interval);
  },
  _leave: function () {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = null;
  },
  stop: function () {
    this._transition(STOPPED);
  },
  close: function () { },
};

RTM.prototype._initConnectionFSM = function () {
  var self = this;
  var events = [
    'open',
    'close',
    'error',
    'start',
    'stop',
    'reconnect',
  ];
  this._transition(STOPPED);
  events.forEach(function (ev) {
    self.on(ev, function () {
      self._safelyCallFSMEvent(ev);
    });
  });
};

RTM.prototype._safelyCallFSMEvent = function (ev) {
  var fn = STATES[this.state][ev];
  logger.debug('FSM event:', ev, 'Current state:', this.state);
  if (fn) {
    try {
      fn.call(this);
    } catch (error) {
      logger.error(error, 'Unexpected error during event callback call', this.state, ev);
    }
  } else {
    logger.warn('Nothing to do for event', ev, this.state);
  }
};

RTM.prototype._transition = function (newState) {
  logger.debug('Transition from', this.state, 'to', newState);
  if (this.state) {
    this._safelyCallFSMEvent('_leave');
    this.fire('leave-' + this.state);
  }
  this.state = newState;
  this._safelyCallFSMEvent('_enter');
  this.fire('enter-' + this.state);
};

RTM.prototype._appendVersion = function (ep) {
  var versionMatch = ep.match(/\/(v\d+)$/);
  var ret = ep;
  var ver;

  if (versionMatch !== null) {
    ver = versionMatch[1];
    logger.warn(
        'satori-rtm-sdk: specifying RTM endpoint with protocol version is deprecated.\n' +
        'satori-rtm-sdk: please remove version \'' + ver + '\' from endpoint:\'' + ep + '\''
    );
    return ret;
  }

  if (ret[ret.length - 1] !== '/') {
    ret += '/';
  }

  return ret + RTM_VER;
};

module.exports = RTM;
