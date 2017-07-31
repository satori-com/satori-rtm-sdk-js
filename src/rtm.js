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
 * An RTM client is the main entry point for accessing RTM.
 *
 * To connect a client to RTM, you must call [RTM.start()]{@link RTM#start}. The RTM SDK attempts
 * to reconnect to RTM if the connection to RTM fails for any reason.
 *
 * A client instance can be in one of the following connection states:
 *  - <strong>stopped:</strong> You called [RTM.stop()]{@link RTM#stop} or RTM disconnected and
 *    hasn't yet reconnected.
 *  - <strong>connecting:</strong> You called [RTM.start()]{@link RTM#start} or the client is
 *    trying to reconnect to RTM.
 *  - <strong>connected:</strong> The client is connected to RTM.
 *  - <strong>awaiting:</strong> The client disconnected and is waiting the specified time period
 *    before reconnecting. See the <code>minReconnectInterval</code> and
 *    <code>maxReconnectInterval</code> options.
 *
 * For each state, an event occurs when the client enters or leaves the state. Call
 * [RTM.on(name, fn)]{@link RTM#on} method to add code that's executed when the client
 * transitions into or out of a state. The syntax for the value of <code>name</code> is
 *
 * <code><strong>[ enter- | leave- ][ stopped | connecting | connected | awaiting ]</strong></code>
 *
 * For example, <code>RTM.on("enter-connected", myFunction)</code>. The next example also shows you
 * how to call <code>RTM.on()</code>
 *
 * @example
 * // Creates an RTM client
 * var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');
 *
 * // Creates a new subscription to the channel named 'your-channel'
* var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);
 *
 * // Adds a subscription event listener that logs messages to the console as they arrive.
 * // The subscription receives all messages in the subscribed channel
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 *
 * // Sets a connection event listener that publishes a message to the channel named
 * // <code>your-channel</code>
 * // when the client is connected to RTM (the client enters the 'connected' state)
 * rtm.on('enter-connected', function () {
 *   rtm.publish('your-channel', {key: 'value'});
 * });
 *
 * // Sets a client event listener that checks incoming messages to see if they indicate an error.
 * // <code>rtm.on()</code> is called for all incoming messages.
 * rtm.on('data', function (pdu) {
 *   if (pdu.action.endsWith('/error')) {
 *     rtm.restart();
 *   }
 * });
 *
 * // Starts the client
 * rtm.start();
 *
 * @param {string} endpoint - WebSocket endpoint for RTM
 * Available from the Dev Portal.
 *
 * @param {string} appkey - appkey used to access RTM
 * Available from the Dev Portal.
 *
 * @param {object} opts - additional RTM client parameters
 *
 * @param {integer} [opts.minReconnectInterval=1000] - minimum
 * time period, in milliseconds, to wait between reconnection attempts
 *
 * @param {integer} [opts.maxReconnectInterval=120000] - maximum
 * time period, in milliseconds, to wait between reconnection attempts
 *
 * @param {boolean} [opts.heartbeatEnabled=true] - enables periodic
 * heartbeat monitoring for the WebSocket connection
 *
 * @param {object} [opts.authProvider] - object that manages authentication for the client.
 * See {@link auth.js}
 *
 * @param {integer} [opts.heartbeatInterval=60000] - interval,
 * in milliseconds, to wait between heartbeat messages
 * @param {integer} [opts.highWaterMark=4194304] - 4MB. High water mark in bytes. If the number
 * of bytes in the WebSocket write buffer exceeds this value,
 * [writeable]{@link RTM#writeable} is set to <code>false</code>.
 *
 * @param {integer} [opts.lowWaterMark=2097152] - 2MB. Low water mark, in bytes. If the
 * Websocket write buffer rises above <code>highWaterMark</code> and then drops below
 * <code>lowWaterMark</code>, [writeable]{@link RTM#writeable} is set to <code>true</code>.
 *
 * @param {integer} [opts.checkWritabilityInterval=100] - Interval,
 * in milliseconds, between checks of the queue length and updates of the
 * [writeable]{@link RTM#writeable} property if necessary.
 *
 * @param {object} [opts.proxyAgent] - proxy server agent.
 * A custom http.Agent implementation like:
 * https-proxy-agent https://github.com/TooTallNate/node-https-proxy-agent#ws-websocket-connection-example
 * socks-proxy-agent https://github.com/TooTallNate/node-socks-proxy-agent#ws-websocket-connection-example
 *
 * @property {boolean} writable - A general indicator of the status of the write buffer.
 * <code>true</code> indicates that the write buffer is shrinking, while <code>false</code>
 * indicates that the write buffer is growing. Test <code>writable</code> to see whether you should
 * continue to write or pause writing.
 *
 * @throws {TypeError} <code>TypeError</code> is thrown if mandatory parameters are
 * missing or invalid.
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
 * If necessary, RTM fast-forwards the subscription when the SDK resubscribes to a channel.
 *
 * To learn more about position tracking and fast-forwarding, see the sections "... with position"
 * and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.
 */

/**
 * Subscription modes.
 *
 * @namespace
 * @readonly
 */

RTM.SubscriptionMode = {
  /**
   *
   * RTM tracks the <code>position</code> value for the subscription and
   * tries to use it when resubscribing after the connection drops and the client reconnects.
   * If the <code>position</code> points to an expired message, RTM fast-forwards to the earliest
   * <code>position</code> that points to a non-expired message.
   *
   * This mode reliably goes to the next available message when RTM is resubscribing. However,
   * RTM always fast-forwards the subscription if necessary, so it never returns an error for an
   * 'out-of-sync' condition.
   *
   * To learn more about position tracking and fast-forwarding, see the sections "... with position"
   * and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.
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
   *
   * RTM doesn't track the <code>position</code> value for the
   * subscription. Instead, when RTM resubscribes following a reconnection, it fast-forwards to
   * the earliest <code>position</code> that points to a non-expired message.
   *
   * Because RTM always fast-forwards the subscription, it never returns an error for an
   * 'out-of-sync' condition.
   *
   * To learn more about position tracking and fast-forwarding, see the sections "... with position"
   * and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.
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
   *
   * RTM always tracks the <code>position</code> value for the subscription and tries to
   * use it when resubscribing after the connection drops and the client reconnects.
   *
   * If the position points to an expired message, the resubscription attempt fails. RTM sends an
   * <code>expired_position</code> error and stops the subscription process.
   *
   * If the subscription is active, and RTM detects that the current <code>position</code> value
   * points to an expired message, the subscription is in an 'out-of-sync' state. In this case,
   * RTM sends an <code>out_of_sync</code> error and unsubscribes you.
   *
   * To learn more about position tracking and fast-forwarding, see the sections "... with position"
   * and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.
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
 * Creates a role-based authentication provider for the client
 * <p>
 * The role-based authentication method is a two-step authentication process based on the HMAC
 * process, using the MD5 hashing routine:
 * <ul>
 * <li>The client obtains a nonce from the server in a handshake request.</li>
 * <li>The client then sends an authorization request with its role secret key hashed with the
 * received nonce.</li>
 * </ul>
 * <p>
 * To get a role secret key for your application, go to the Dev Portal.
 *
 * @param {string} role - role name set in the Dev Portal
 *
 * @param {string} roleSecret - role secret key
 *
 * @param {object} opts - additional authentication options
 *
 * @param {integer} [opts.timeout=30000] - amount of time, in milliseconds, before the
 * authentication operation times out
 *
 * @throws {TypeError} thrown if mandatory parameters are missing or invalid
 *
 * @return {function} authentication provider for the role-based authentication method
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
 * Use [RTM.on(name, fn)][RTM.on()]{@link RTM#on} to define application functionality,
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
 * Stops the client. The RTM SDK starts to close the WebSocket connection and
 * does not start it again unless you call [RTM.start()]{@link RTM#start}.
 *
 * Use this method to explicitly stop all interaction with RTM.
 *
 * Use [RTM.on("enter-stopped", function())]{@link RTM#on} or
 * [RTM.on("leave-stopped", function())]{@link RTM#on} to
 * provide code that executes when the client enters or leaves the <code>stopped</code> state.
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
 * Calls [RTM.stop()]{@link RTM#stop} followed by [RTM.start()]{@link RTM#start] to
 * restart the client. RTM issues events for these client states, which you can handle with code in
 * [RTM.on(name, function())]{@link RTM#on}.
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
 * @return {boolean} <code>true</code> if the client is in the <code>stopped</code> state,
 * otherwise <code>false</code>
 */
RTM.prototype.isStopped = function () {
  return this.state === STOPPED;
};

/**
 * Returns <code>true</code> if the client is in the <code>connected</code> state.
 *
 * In this state, the WebSocket connection to RTM is established and any requested authentication
 * has completed successfully .
 *
 * @return {boolean} <code>true</code> if the client is in the <code>connected</code> state,
 * otherwise <code>false</code>
 */
RTM.prototype.isConnected = function () {
  return this.state === CONNECTED;
};

/**
 * Returns the existing [Subscription]{@link Subscription} object for the specified subscription id.
 *
 * @param {string} subscriptionId - the id for an existing [Subscription]{@link Subscription} object
 *
 * @throws {TypeError} thrown if <code>subscriptionId</code> is missing, invalid, or if a
 * [Subscription]{@link Subscription} object with that id doesn't exist.
 *
 * @return {Subscription} the [Subscription]{@link Subscription} object
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
 * When you create a subscription, you can specify additional properties.
 * For example, you can add a streamview, or you can specify the
 * what the SDK does when it resubscribes after a reconnection.
 *
 * @param {string} channelOrSubId - string containing a channel id or name. If you do not
 * specify the <code>filter</code> parameter, specify the channel name. Otherwise,
 * specify a unique identifier for your subscription to this channel.
 *
 * @param {RTM.SubscriptionMode} mode
 * subscription mode. This mode determines the behaviour of the RTM SDK and RTM when resubscribing
 * after a reconnection. See [SubscriptionMode]{@link SubscriptionMode}.
 *
 * @param {object} [bodyOpts={}]
 * additional options for the subscription
 *
 *
 * @throws {TypeError} thrown if mandatory parameters are missing or invalid.
 *
 * @return {Subscription} - subscription object
 *
 * @example
 * // Creates a new RTM client
 * var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');
 *
 * // Creates a subscription with the name 'your-channel'
 * var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);
 *
 * // Writes incoming messages to the log
 * subscription.on('rtm/subscription/data', function (pdu) {
 *     pdu.body.messages.forEach(console.log);
 * });
 *
 * // Starts the client
 * rtm.start();
 *
 * @example
 * // Creates a new RTM client
 * var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');
 *
 * // Subscribes to the channel named 'my-channel' using a streamview
 * var subscription = rtm.subscribe('my-filter', RTM.SubscriptionMode.SIMPLE, {
 *   filter: 'SELECT * FROM my-channel WHERE object.param >= 1 OR object.id == 0',
 * });
 *
 * // Writes incoming messages to the log
 * subscription.on('rtm/subscription/data', function (pdu) {
 *   pdu.body.messages.forEach(console.log);
 * });
 *
 * // Sets a client event listener, for unsolicited subscription PDUs, that reacts to an error PDU
 * // by restarting the client connection. The PDU is passed as a parameter.
 * rtm.on('data', function (pdu) {
 *   if (pdu.action.endsWith('/error')) {
 *     rtm.restart();
 *   }
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
 * Updates an existing [Subscription]{@link Subscription} object. Existing
 * [Subscription]{@link Subscription} event handlers are copied to the updated object.
 *
 * Use this method to change an existing subscription. For example, use it to add or change a
 * streamview.
 *
 * @param {string} channelOrSubId - subscription id or channel name for
 * the existing subscription
 *
 * @param {Object} opts
 * Properties for the updated <code>Subscription</code> object. See
 * [RTM.subscribe(channelOrSubId, opts)]{@link #subscribe} for the supported property names.
 *
 * @param {Function} [onCompleted]
 * function to execute on the updated <code>Subscription</code> object
 *
 * @throws {TypeError} thrown if mandatory parameters are missing or invalid.
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
 * @param {string} subscriptionId - Subscription id or channel name.
 *
 * @param {Function} [onAck]
 * Callback function that's invoked when RTM responds to the unsubscribe request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
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
  // If client is disconnected this method is called immediately without argument.
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
 * Publishes a message to a channel. The client must be connected.
 *
 * @example
 * // Publishes to the channel named "channel", and provides a callback function that's invoked when
 * // RTM responds to the request. If the PDU "action" value doesn't end with "ok", the function
 * // logs an error.
 * rtm.publish('channel', {key: 'value'}, function (pdu) {
 *   if (!pdu.action.endsWith('/ok')) {
 *     console.log('something went wrong');
 *   }
 * });
 *
 * @param {string} channel - channel name
 *
 * @param {JSON} message
 * JSON containing the message to publish
 *
 * @param {Function} [onAck]
 * Callback function that's invoked when RTM responds to the publish request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
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
 * Data Unit (<strong>PDU</strong>). The client must be connected.
 *
 * @variation 1
 *
 * @param {string} channel - name of the channel to read from
 *
 * @param {Function} [onAck]
 * Callback function that's invoked when RTM responds to the publish request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @example
 * // Reads from the channel named 'channel' and prints the response PDU
 * rtm.read('channel', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
 *
 * @return {void}
 *
 * @also
 *
 * Reads the latest message written to specific channel, as a Protocol
 * Data Unit (<strong>PDU</strong>). The client must be connected.
 *
 * @variation 2
 *
 * @param {string} channel - name of the channel to read from
 *
 * @param {object} [opts={}]
 * Additional options in the read PDU that's sent to RTM in the request.
 * For more information, see the section "Read PDU" in the "RTM API" chapter of <em>Satori Docs/em>.
 *
 * @param {object} [opts.bodyOpts={}]
 * Additional options in the <code>body</code> element of the read PDU that's sent to
 * RTM in the request.
 *
 * @param {Function} [opts.onAck]
 * Callback function that's invoked when RTM responds to the publish request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @example
 * // Reads from the channel named 'channel', starting at the position specified by the
 * // "position" key.
 * // Prints the response PDU.
 * rtm.read('channel', {
 *   bodyOpts: { position: '1485444476:0' },
 *   onAck: function (pdu) {
 *     console.log(pdu);
 *   }
 * })
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
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
 * Writes a value to the specified channel. The client must be connected.
 *
 * @param {string} channel - name of the channel to write to
 *
 * @param {JSON} value
 * JSON containing the PDU to write to the channel
 *
 * @param {Function} [onAck]
 * Callback function that's invoked when RTM responds to the publish request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @example
 * // Writes the string 'value' to the channel named 'channel' and prints the response PDU.
 * rtm.write('channel', 'value', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
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
 * Callback function that's invoked when RTM responds to the publish request. RTM passes the
 * response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a
 * response PDU.
 *
 * @example
 * rtm.delete('channel', function (pdu) {
 *     console.log(pdu);
 * })
 *
 * @throws {TypeError} thrown if required parameters are missing or invalid
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
  if ('proxyAgent' in this.options) {
    logger.debug('   (using proxy agent)');
  }
  ws = this.ws = new W3CWebSocket(this.endpoint, [], {
    perMessageDeflate: false,
    agent: this.options.proxyAgent,
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
