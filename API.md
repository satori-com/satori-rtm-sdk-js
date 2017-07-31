## Classes

<dl>
<dt><a href="#Observer">Observer</a></dt>
<dd></dd>
<dt><a href="#RTM">RTM</a> ⇐ <code><a href="#Observer">Observer</a></code></dt>
<dd></dd>
<dt><a href="#Subscription">Subscription</a> ⇐ <code><a href="#Observer">Observer</a></code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SubscriptionMode">SubscriptionMode</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="Observer"></a>

## Observer
**Kind**: global class  

* [Observer](#Observer)
    * [new Observer()](#new_Observer_new)
    * [.on(name, fn)](#Observer+on) ⇒ <code>void</code>
    * [.off(name, fn)](#Observer+off) ⇒ <code>void</code>
    * [.fire(name, ...args)](#Observer+fire) ⇒ <code>void</code>

<a name="new_Observer_new"></a>

### new Observer()
Creates an observer instance.

<a name="Observer+on"></a>

### observer.on(name, fn) ⇒ <code>void</code>
Attaches an event handler function for the event specified in <code>name</code>.

The event is usually related to a client or subscription state. It may also be an event
that occurs when the client or subscription receives information from RTM. For example, the
the following are [RTM](#RTM) client events:
<ul>
    <li><code>data:</code> The client received a PDU from RTM.</li>
    <li><code>enter-connected:</code> The client is now connected to RTM.</li>
</ul>
A possible event for a [Subscription](#Subscription) is <code>enter-subscribed</code>.

The <code>fn</code> parameter is a function that's invoked when the event occurs. The PDU for
the event is passed to this function.

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+off"></a>

### observer.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+fire"></a>

### observer.fire(name, ...args) ⇒ <code>void</code>
Executes all handlers attached for the specified event type.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of an event that has attached handlers |
| ...args | <code>Object</code> | event arguments. |

<a name="RTM"></a>

## RTM ⇐ <code>[Observer](#Observer)</code>
**Kind**: global class  
**Extends:** <code>[Observer](#Observer)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| writable | <code>boolean</code> | A general indicator of the status of the write buffer. <code>true</code> indicates that the write buffer is shrinking, while <code>false</code> indicates that the write buffer is growing. Test <code>writable</code> to see whether you should continue to write or pause writing. |


* [RTM](#RTM) ⇐ <code>[Observer](#Observer)</code>
    * [new RTM(endpoint, appkey, opts)](#new_RTM_new)
    * _instance_
        * [.start()](#RTM+start) ⇒ <code>void</code>
        * [.stop()](#RTM+stop) ⇒ <code>void</code>
        * [.restart()](#RTM+restart) ⇒ <code>void</code>
        * [.isStopped()](#RTM+isStopped) ⇒ <code>boolean</code>
        * [.isConnected()](#RTM+isConnected) ⇒ <code>boolean</code>
        * [.getSubscription(subscriptionId)](#RTM+getSubscription) ⇒ <code>[Subscription](#Subscription)</code>
        * [.subscribe(channelOrSubId, mode, [bodyOpts])](#RTM+subscribe) ⇒ <code>[Subscription](#Subscription)</code>
        * [.resubscribe(channelOrSubId, opts, [onCompleted])](#RTM+resubscribe) ⇒ <code>void</code>
        * [.unsubscribe(subscriptionId, [onAck])](#RTM+unsubscribe) ⇒ <code>void</code>
        * [.publish(channel, message, [onAck])](#RTM+publish) ⇒ <code>void</code>
        * [.read(channel, [onAck])](#RTM+read(1)) ⇒ <code>void</code>
        * [.read(channel, [opts])](#RTM+read(2)) ⇒ <code>void</code>
        * [.write(channel, value, [onAck])](#RTM+write) ⇒ <code>void</code>
        * [.delete(channel, [onAck])](#RTM+delete) ⇒ <code>void</code>
        * [.search(prefix, [onAck])](#RTM+search) ⇒ <code>void</code>
        * [.on(name, fn)](#Observer+on) ⇒ <code>void</code>
        * [.off(name, fn)](#Observer+off) ⇒ <code>void</code>
        * [.fire(name, ...args)](#Observer+fire) ⇒ <code>void</code>
    * _static_
        * [.SubscriptionMode](#RTM.SubscriptionMode) : <code>object</code>
            * [.RELIABLE](#RTM.SubscriptionMode.RELIABLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
            * [.SIMPLE](#RTM.SubscriptionMode.SIMPLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
            * [.ADVANCED](#RTM.SubscriptionMode.ADVANCED) : <code>[SubscriptionMode](#SubscriptionMode)</code>
        * [.roleSecretAuthProvider(role, roleSecret, opts)](#RTM.roleSecretAuthProvider) ⇒ <code>function</code>

<a name="new_RTM_new"></a>

### new RTM(endpoint, appkey, opts)
An RTM client is the main entry point for accessing RTM.

To connect a client to RTM, you must call [RTM.start()](#RTM+start). The RTM SDK attempts
to reconnect to RTM if the connection to RTM fails for any reason.

A client instance can be in one of the following connection states:
 - <strong>stopped:</strong> You called [RTM.stop()](#RTM+stop) or RTM disconnected and
   hasn't yet reconnected.
 - <strong>connecting:</strong> You called [RTM.start()](#RTM+start) or the client is
   trying to reconnect to RTM.
 - <strong>connected:</strong> The client is connected to RTM.
 - <strong>awaiting:</strong> The client disconnected and is waiting the specified time period
   before reconnecting. See the <code>minReconnectInterval</code> and
   <code>maxReconnectInterval</code> options.

For each state, an event occurs when the client enters or leaves the state. Call
[RTM.on(name, fn)](#Observer+on) method to add code that's executed when the client
transitions into or out of a state. The syntax for the value of <code>name</code> is

<code><strong>[ enter- | leave- ][ stopped | connecting | connected | awaiting ]</strong></code>

For example, <code>RTM.on("enter-connected", myFunction)</code>. The next example also shows you
how to call <code>RTM.on()</code>

**Throws**:

- <code>TypeError</code> <code>TypeError</code> is thrown if mandatory parameters are
missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | <code>string</code> |  | WebSocket endpoint for RTM Available from the Dev Portal. |
| appkey | <code>string</code> |  | appkey used to access RTM Available from the Dev Portal. |
| opts | <code>object</code> |  | additional RTM client parameters |
| [opts.minReconnectInterval] | <code>integer</code> | <code>1000</code> | minimum time period, in milliseconds, to wait between reconnection attempts |
| [opts.maxReconnectInterval] | <code>integer</code> | <code>120000</code> | maximum time period, in milliseconds, to wait between reconnection attempts |
| [opts.heartbeatEnabled] | <code>boolean</code> | <code>true</code> | enables periodic heartbeat monitoring for the WebSocket connection |
| [opts.authProvider] | <code>object</code> |  | object that manages authentication for the client. See [auth.js](auth.js) |
| [opts.heartbeatInterval] | <code>integer</code> | <code>60000</code> | interval, in milliseconds, to wait between heartbeat messages |
| [opts.highWaterMark] | <code>integer</code> | <code>4194304</code> | 4MB. High water mark in bytes. If the number of bytes in the WebSocket write buffer exceeds this value, [writeable](RTM#writeable) is set to <code>false</code>. |
| [opts.lowWaterMark] | <code>integer</code> | <code>2097152</code> | 2MB. Low water mark, in bytes. If the Websocket write buffer rises above <code>highWaterMark</code> and then drops below <code>lowWaterMark</code>, [writeable](RTM#writeable) is set to <code>true</code>. |
| [opts.checkWritabilityInterval] | <code>integer</code> | <code>100</code> | Interval, in milliseconds, between checks of the queue length and updates of the [writeable](RTM#writeable) property if necessary. |
| [opts.proxyAgent] | <code>object</code> |  | proxy server agent. A custom http.Agent implementation like: https-proxy-agent https://github.com/TooTallNate/node-https-proxy-agent#ws-websocket-connection-example socks-proxy-agent https://github.com/TooTallNate/node-socks-proxy-agent#ws-websocket-connection-example |

**Example**  
```js
// Creates an RTM client
var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');

// Creates a new subscription to the channel named 'your-channel'
var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);

// Adds a subscription event listener that logs messages to the console as they arrive.
// The subscription receives all messages in the subscribed channel
subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});

// Sets a connection event listener that publishes a message to the channel named
// <code>your-channel</code>
// when the client is connected to RTM (the client enters the 'connected' state)
rtm.on('enter-connected', function () {
  rtm.publish('your-channel', {key: 'value'});
});

// Sets a client event listener that checks incoming messages to see if they indicate an error.
// <code>rtm.on()</code> is called for all incoming messages.
rtm.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    rtm.restart();
  }
});

// Starts the client
rtm.start();
```
<a name="RTM+start"></a>

### RTM.start() ⇒ <code>void</code>
Starts the client.

The client begins to establish the WebSocket connection
to RTM and then tracks the state of the connection. If the WebSocket
connection drops for any reason, the JavaScript SDK attempts to reconnect.


Use [RTM.on(name, fn)][RTM.on()](#Observer+on) to define application functionality,
for example, when the application enters or leaves the
<code>connecting</code> or <code>connected</code> states.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+stop"></a>

### RTM.stop() ⇒ <code>void</code>
Stops the client. The RTM SDK starts to close the WebSocket connection and
does not start it again unless you call [RTM.start()](#RTM+start).

Use this method to explicitly stop all interaction with RTM.

Use [RTM.on("enter-stopped", function())](#Observer+on) or
[RTM.on("leave-stopped", function())](#Observer+on) to
provide code that executes when the client enters or leaves the <code>stopped</code> state.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+restart"></a>

### RTM.restart() ⇒ <code>void</code>
Calls [RTM.stop()](#RTM+stop) followed by [RTM.start()]{@link RTM#start] to
restart the client. RTM issues events for these client states, which you can handle with code in
[RTM.on(name, function())](#Observer+on).

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+isStopped"></a>

### RTM.isStopped() ⇒ <code>boolean</code>
Returns <code>true</code> if the RTM client is in the <code>stopped</code> state.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>boolean</code> - <code>true</code> if the client is in the <code>stopped</code> state,
otherwise <code>false</code>  
<a name="RTM+isConnected"></a>

### RTM.isConnected() ⇒ <code>boolean</code>
Returns <code>true</code> if the client is in the <code>connected</code> state.

In this state, the WebSocket connection to RTM is established and any requested authentication
has completed successfully .

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>boolean</code> - <code>true</code> if the client is in the <code>connected</code> state,
otherwise <code>false</code>  
<a name="RTM+getSubscription"></a>

### RTM.getSubscription(subscriptionId) ⇒ <code>[Subscription](#Subscription)</code>
Returns the existing [Subscription](#Subscription) object for the specified subscription id.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>[Subscription](#Subscription)</code> - the [Subscription](#Subscription) object  
**Throws**:

- <code>TypeError</code> thrown if <code>subscriptionId</code> is missing, invalid, or if a
[Subscription](#Subscription) object with that id doesn't exist.


| Param | Type | Description |
| --- | --- | --- |
| subscriptionId | <code>string</code> | the id for an existing [Subscription](#Subscription) object |

<a name="RTM+subscribe"></a>

### RTM.subscribe(channelOrSubId, mode, [bodyOpts]) ⇒ <code>[Subscription](#Subscription)</code>
Creates a subscription to the specified channel.

When you create a subscription, you can specify additional properties.
For example, you can add a streamview, or you can specify the
what the SDK does when it resubscribes after a reconnection.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>[Subscription](#Subscription)</code> - - subscription object  
**Throws**:

- <code>TypeError</code> thrown if mandatory parameters are missing or invalid.

**See**

- [SIMPLE](#RTM.SubscriptionMode.SIMPLE)
- [RELIABLE](#RTM.SubscriptionMode.RELIABLE)
- [ADVANCED](#RTM.SubscriptionMode.ADVANCED)


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| channelOrSubId | <code>string</code> |  | string containing a channel id or name. If you do not specify the <code>filter</code> parameter, specify the channel name. Otherwise, specify a unique identifier for your subscription to this channel. |
| mode | <code>[SubscriptionMode](#RTM.SubscriptionMode)</code> |  | subscription mode. This mode determines the behaviour of the RTM SDK and RTM when resubscribing after a reconnection. See [SubscriptionMode](#SubscriptionMode). |
| [bodyOpts] | <code>object</code> | <code>{}</code> | additional options for the subscription |

**Example**  
```js
// Creates a new RTM client
var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');

// Creates a subscription with the name 'your-channel'
var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);

// Writes incoming messages to the log
subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});

// Starts the client
rtm.start();
```
**Example**  
```js
// Creates a new RTM client
var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');

// Subscribes to the channel named 'my-channel' using a streamview
var subscription = rtm.subscribe('my-filter', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT * FROM my-channel WHERE object.param >= 1 OR object.id == 0',
});

// Writes incoming messages to the log
subscription.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(console.log);
});

// Sets a client event listener, for unsolicited subscription PDUs, that reacts to an error PDU
// by restarting the client connection. The PDU is passed as a parameter.
rtm.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    rtm.restart();
  }

rtm.start();
```
<a name="RTM+resubscribe"></a>

### RTM.resubscribe(channelOrSubId, opts, [onCompleted]) ⇒ <code>void</code>
Updates an existing [Subscription](#Subscription) object. Existing
[Subscription](#Subscription) event handlers are copied to the updated object.

Use this method to change an existing subscription. For example, use it to add or change a
streamview.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if mandatory parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channelOrSubId | <code>string</code> | subscription id or channel name for the existing subscription |
| opts | <code>Object</code> | Properties for the updated <code>Subscription</code> object. See [RTM.subscribe(channelOrSubId, opts)](#subscribe) for the supported property names. |
| [onCompleted] | <code>function</code> | function to execute on the updated <code>Subscription</code> object |

<a name="RTM+unsubscribe"></a>

### RTM.unsubscribe(subscriptionId, [onAck]) ⇒ <code>void</code>
Removes the specified subscription.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Description |
| --- | --- | --- |
| subscriptionId | <code>string</code> | Subscription id or channel name. |
| [onAck] | <code>function</code> | Callback function that's invoked when RTM responds to the unsubscribe request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

<a name="RTM+publish"></a>

### RTM.publish(channel, message, [onAck]) ⇒ <code>void</code>
Publishes a message to a channel. The client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | channel name |
| message | <code>JSON</code> | JSON containing the message to publish |
| [onAck] | <code>function</code> | Callback function that's invoked when RTM responds to the publish request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

**Example**  
```js
// Publishes to the channel named "channel", and provides a callback function that's invoked when
// RTM responds to the request. If the PDU "action" value doesn't end with "ok", the function
// logs an error.
rtm.publish('channel', {key: 'value'}, function (pdu) {
  if (!pdu.action.endsWith('/ok')) {
    console.log('something went wrong');
  }
});
```
<a name="RTM+read(1)"></a>

### RTM.read(channel, [onAck]) ⇒ <code>void</code>
Reads the latest message written to a specific channel, as a Protocol
Data Unit (<strong>PDU</strong>). The client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | name of the channel to read from |
| [onAck] | <code>function</code> | Callback function that's invoked when RTM responds to the publish request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

**Example**  
```js
// Reads from the channel named 'channel' and prints the response PDU
rtm.read('channel', function (pdu) {
    console.log(pdu);
})
```
<a name="RTM+read(2)"></a>

### RTM.read(channel, [opts]) ⇒ <code>void</code>
Reads the latest message written to specific channel, as a Protocol
Data Unit (<strong>PDU</strong>). The client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| channel | <code>string</code> |  | name of the channel to read from |
| [opts] | <code>object</code> | <code>{}</code> | Additional options in the read PDU that's sent to RTM in the request. For more information, see the section "Read PDU" in the "RTM API" chapter of <em>Satori Docs/em>. |
| [opts.bodyOpts] | <code>object</code> | <code>{}</code> | Additional options in the <code>body</code> element of the read PDU that's sent to RTM in the request. |
| [opts.onAck] | <code>function</code> |  | Callback function that's invoked when RTM responds to the publish request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

**Example**  
```js
// Reads from the channel named 'channel', starting at the position specified by the
// "position" key.
// Prints the response PDU.
rtm.read('channel', {
  bodyOpts: { position: '1485444476:0' },
  onAck: function (pdu) {
    console.log(pdu);
  }
})
```
<a name="RTM+write"></a>

### RTM.write(channel, value, [onAck]) ⇒ <code>void</code>
Writes a value to the specified channel. The client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | name of the channel to write to |
| value | <code>JSON</code> | JSON containing the PDU to write to the channel |
| [onAck] | <code>function</code> | Callback function that's invoked when RTM responds to the publish request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

**Example**  
```js
// Writes the string 'value' to the channel named 'channel' and prints the response PDU.
rtm.write('channel', 'value', function (pdu) {
    console.log(pdu);
})
```
<a name="RTM+delete"></a>

### RTM.delete(channel, [onAck]) ⇒ <code>void</code>
Deletes the value for the associated channel. The [RTM](#RTM) client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> thrown if required parameters are missing or invalid


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel name. |
| [onAck] | <code>function</code> | Callback function that's invoked when RTM responds to the publish request. RTM passes the response PDU to this function. If you don't specify <code>onAck</code>, RTM doesn't send a response PDU. |

**Example**  
```js
rtm.delete('channel', function (pdu) {
    console.log(pdu);
})
```
<a name="RTM+search"></a>

### RTM.search(prefix, [onAck]) ⇒ <code>void</code>
Performs a channel search for a given user-defined prefix. This method passes
replies to the callback. The [RTM](#RTM) client must be connected.

RTM may send multiple responses to the same search request: zero or
more search result PDUs with an action of <code>rtm/search/data</code>
(depending on the results of the search). Each channel found is only sent
once. After the search result PDUs, RTM follows with a positive response PDU:
<code>rtm/search/ok</code>.

Otherwise, RTM sends an error PDU with an action of <code>rtm/search/error</code>.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| prefix | <code>string</code> | Channel prefix. |
| [onAck] | <code>function</code> | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

**Example**  
```js
var channels = [];
rtm.search('ch', function (pdu) {
    channels = channels.concat(pdu.body.channels);
    if (pdu.action === 'rtm/search/ok') {
      console.log(channels);
    }
})
```
<a name="Observer+on"></a>

### RTM.on(name, fn) ⇒ <code>void</code>
Attaches an event handler function for the event specified in <code>name</code>.

The event is usually related to a client or subscription state. It may also be an event
that occurs when the client or subscription receives information from RTM. For example, the
the following are [RTM](#RTM) client events:
<ul>
    <li><code>data:</code> The client received a PDU from RTM.</li>
    <li><code>enter-connected:</code> The client is now connected to RTM.</li>
</ul>
A possible event for a [Subscription](#Subscription) is <code>enter-subscribed</code>.

The <code>fn</code> parameter is a function that's invoked when the event occurs. The PDU for
the event is passed to this function.

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+off"></a>

### RTM.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+fire"></a>

### RTM.fire(name, ...args) ⇒ <code>void</code>
Executes all handlers attached for the specified event type.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of an event that has attached handlers |
| ...args | <code>Object</code> | event arguments. |

<a name="RTM.SubscriptionMode"></a>

### RTM.SubscriptionMode : <code>object</code>
Subscription modes.

**Kind**: static namespace of <code>[RTM](#RTM)</code>  
**Read only**: true  

* [.SubscriptionMode](#RTM.SubscriptionMode) : <code>object</code>
    * [.RELIABLE](#RTM.SubscriptionMode.RELIABLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
    * [.SIMPLE](#RTM.SubscriptionMode.SIMPLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
    * [.ADVANCED](#RTM.SubscriptionMode.ADVANCED) : <code>[SubscriptionMode](#SubscriptionMode)</code>

<a name="RTM.SubscriptionMode.RELIABLE"></a>

#### SubscriptionMode.RELIABLE : <code>[SubscriptionMode](#SubscriptionMode)</code>
RTM tracks the <code>position</code> value for the subscription and
tries to use it when resubscribing after the connection drops and the client reconnects.
If the <code>position</code> points to an expired message, RTM fast-forwards to the earliest
<code>position</code> that points to a non-expired message.

This mode reliably goes to the next available message when RTM is resubscribing. However,
RTM always fast-forwards the subscription if necessary, so it never returns an error for an
'out-of-sync' condition.

To learn more about position tracking and fast-forwarding, see the sections "... with position"
and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.SubscriptionMode.SIMPLE"></a>

#### SubscriptionMode.SIMPLE : <code>[SubscriptionMode](#SubscriptionMode)</code>
RTM doesn't track the <code>position</code> value for the
subscription. Instead, when RTM resubscribes following a reconnection, it fast-forwards to
the earliest <code>position</code> that points to a non-expired message.

Because RTM always fast-forwards the subscription, it never returns an error for an
'out-of-sync' condition.

To learn more about position tracking and fast-forwarding, see the sections "... with position"
and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.SubscriptionMode.ADVANCED"></a>

#### SubscriptionMode.ADVANCED : <code>[SubscriptionMode](#SubscriptionMode)</code>
RTM always tracks the <code>position</code> value for the subscription and tries to
use it when resubscribing after the connection drops and the client reconnects.

If the position points to an expired message, the resubscription attempt fails. RTM sends an
<code>expired_position</code> error and stops the subscription process.

If the subscription is active, and RTM detects that the current <code>position</code> value
points to an expired message, the subscription is in an 'out-of-sync' state. In this case,
RTM sends an <code>out_of_sync</code> error and unsubscribes you.

To learn more about position tracking and fast-forwarding, see the sections "... with position"
and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.roleSecretAuthProvider"></a>

### RTM.roleSecretAuthProvider(role, roleSecret, opts) ⇒ <code>function</code>
Creates a role-based authentication provider for the client
<p>
The role-based authentication method is a two-step authentication process based on the HMAC
process, using the MD5 hashing routine:
<ul>
<li>The client obtains a nonce from the server in a handshake request.</li>
<li>The client then sends an authorization request with its role secret key hashed with the
received nonce.</li>
</ul>
<p>
To get a role secret key for your application, go to the Dev Portal.

**Kind**: static method of <code>[RTM](#RTM)</code>  
**Returns**: <code>function</code> - authentication provider for the role-based authentication method  
**Throws**:

- <code>TypeError</code> thrown if mandatory parameters are missing or invalid


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| role | <code>string</code> |  | role name set in the Dev Portal |
| roleSecret | <code>string</code> |  | role secret key |
| opts | <code>object</code> |  | additional authentication options |
| [opts.timeout] | <code>integer</code> | <code>30000</code> | amount of time, in milliseconds, before the authentication operation times out |

<a name="Subscription"></a>

## Subscription ⇐ <code>[Observer](#Observer)</code>
**Kind**: global class  
**Extends:** <code>[Observer](#Observer)</code>  

* [Subscription](#Subscription) ⇐ <code>[Observer](#Observer)</code>
    * [new Subscription(subscriptionId, opts)](#new_Subscription_new)
    * [.on(name, fn)](#Observer+on) ⇒ <code>void</code>
    * [.off(name, fn)](#Observer+off) ⇒ <code>void</code>
    * [.fire(name, ...args)](#Observer+fire) ⇒ <code>void</code>

<a name="new_Subscription_new"></a>

### new Subscription(subscriptionId, opts)
<code>Subscription</code> represents a subscription to a channel. Its functions manage the
subscription state and respond to subscription events.

Use <code>Subscription</code> functions to specify code that executes when an event occurs or
when the subscription enters a specific state.

For example, use <code>Subscription.on("rtm/subscription/data", fn())</code> to specify a
function that's executed when the subscription receives a message. Use
<code>Subscription.on("enter-subscribed", fn())</code> to specify a function that's executed
when the subscription is active.

When your application receives a channel message, the <code>data</code> event occurs and the
message is passed as a Protocol Data Unit (<strong>PDU</strong>) to the function specified for
<code>Subscription.on("rtm/subscription/data", fn())</code>.

You can also specify an event handler function that executes when the subscription enters or
leaves subscribed state. For example, to specify an event handler for the
<code>enter-subscribed</code> event, use <code>Subscription.on("enter-subscribed", fn()}</code>.

<strong>Note:</strong> When the connection from the client to RTM drops, all subscriptions are
unsubscribed and then resubscribed when the connection is restored.

**Throws**:

- <code>TypeError</code> indicates that mandatory parameters are missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| subscriptionId | <code>string</code> |  | unique identifier for the subscription. If you don't use the <code>filter</code> parameter to specify a streamview, subscriptionId is treated as a channel name. |
| opts | <code>Object</code> |  | additional subscription options |
| [opts.mode] | <code>boolean</code> |  | subscription mode |
| [opts.bodyOpts] | <code>object</code> | <code>{}</code> | Additional options for the subscription. These options are sent to RTM in the <code>body</code> element of the PDU that represents the subscribe request. |

**Example**  
```js
// Creates an RTM client
var rtm = new RTM('YOUR_ENDPOINT', 'YOUR_APPKEY');
// create a new subscription to the channel named 'your-channel'
var subscription = rtm.subscribe('your-channel');

subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});
subscription.on('enter-subscribed', function () {
    console.log('Subscribed!');
});
subscription.on('data', function (pdu) {
    if (pdu.action.endWith('/error')) {
        rtm.restart();
    }
});
```
<a name="Observer+on"></a>

### subscription.on(name, fn) ⇒ <code>void</code>
Attaches an event handler function for the event specified in <code>name</code>.

The event is usually related to a client or subscription state. It may also be an event
that occurs when the client or subscription receives information from RTM. For example, the
the following are [RTM](#RTM) client events:
<ul>
    <li><code>data:</code> The client received a PDU from RTM.</li>
    <li><code>enter-connected:</code> The client is now connected to RTM.</li>
</ul>
A possible event for a [Subscription](#Subscription) is <code>enter-subscribed</code>.

The <code>fn</code> parameter is a function that's invoked when the event occurs. The PDU for
the event is passed to this function.

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+off"></a>

### subscription.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | event name |
| fn | <code>function</code> | event handler function |

<a name="Observer+fire"></a>

### subscription.fire(name, ...args) ⇒ <code>void</code>
Executes all handlers attached for the specified event type.

The event specified in <code>name</code> is an [RTM](#RTM) or
[Subscription](#Subscription) event that has an attached event handler function
(see the <code>on()</code> function).

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of an event that has attached handlers |
| ...args | <code>Object</code> | event arguments. |

<a name="SubscriptionMode"></a>

## SubscriptionMode : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| trackPosition | <code>boolean</code> | Tracks the stream position received from RTM. RTM includes the <code>position</code> parameter in responses to publish and subscribe requests and in subscription data messages. The SDK can attempt to resubscribe to the channel data stream from this position. |
| fastForward | <code>boolean</code> | If necessary, RTM fast-forwards the subscription when the SDK resubscribes to a channel. To learn more about position tracking and fast-forwarding, see the sections "... with position" and "... with fast-forward (advanced)" in the chapter "Subscribing" in <em>Satori Docs</em>. |

