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
    * [.fire(name)](#Observer+fire) ⇒ <code>void</code>

<a name="new_Observer_new"></a>

### new Observer()
Creates an observer instance.

<a name="Observer+on"></a>

### observer.on(name, fn) ⇒ <code>void</code>
Attaches an event handler function for named event.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+off"></a>

### observer.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+fire"></a>

### observer.fire(name) ⇒ <code>void</code>
Executes all handlers attached to the given event type.

The event <code>name</code> is one of the client or subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

**Kind**: instance method of <code>[Observer](#Observer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |

<a name="RTM"></a>

## RTM ⇐ <code>[Observer](#Observer)</code>
**Kind**: global class  
**Extends:** <code>[Observer](#Observer)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| writable | <code>boolean</code> | Indicates if the queue length in the WebSocket write buffer, in bytes, is lower than the <code>highWaterMark</code> value. |


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
        * [.fire(name)](#Observer+fire) ⇒ <code>void</code>
    * _static_
        * [.SubscriptionMode](#RTM.SubscriptionMode) : <code>object</code>
            * [.RELIABLE](#RTM.SubscriptionMode.RELIABLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
            * [.SIMPLE](#RTM.SubscriptionMode.SIMPLE) : <code>[SubscriptionMode](#SubscriptionMode)</code>
            * [.ADVANCED](#RTM.SubscriptionMode.ADVANCED) : <code>[SubscriptionMode](#SubscriptionMode)</code>
        * [.roleSecretAuthProvider(role, roleSecret, opts)](#RTM.roleSecretAuthProvider) ⇒ <code>function</code>

<a name="new_RTM_new"></a>

### new RTM(endpoint, appkey, opts)
The <code>RTM</code> class is the main entry point to manage the
WebSocket connection from the JavaScript SDK to RTM.

Use the RTM class to create a client instance from which you can
publish messages and subscribe to channels. Create separate
[Subscription](#Subscription) objects for each channel to
which you want to subscribe.

Use the [publish(channel, message, onAck)](#RTM+publish)
method to publish messages and either the
[Subscription.on(name, fn)](#Observer+on) or
[RTM.on(name, fn)](#Observer+on) methods to process incoming messages.

A state machine for the client defines the status of the client instance.
A client instance can be in one of the following states: <code>stopped</code>,
<code>connecting</code>, <code>connected</code>, or code>awaiting</code>.

Each client event occurs when the client enters or leaves a state. Use the
RTM.on(name, fn)][on](#Observer+on) method to define logic for when the client
transitions into or out of a state. See
<strong>State Machines</strong> in the online docs.

**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | <code>string</code> |  | Endpoint for RTM. Available from the Dev Portal. |
| appkey | <code>string</code> |  | Appkey used to access RTM. Available from the Dev Portal. |
| opts | <code>object</code> |  | Additional parameters for the RTM client instance. |
| [opts.minReconnectInterval] | <code>integer</code> | <code>1000</code> | Minimum time period, in milliseconds, to wait between reconnection attempts. |
| [opts.maxReconnectInterval] | <code>integer</code> | <code>120000</code> | Maximum time period, in milliseconds, to wait between reconnection attempts. |
| [opts.heartbeatEnabled] | <code>boolean</code> | <code>true</code> | Enables periodic heartbeat monitoring for the WebSocket connection. |
| [opts.authProvider] | <code>object</code> |  | Provider that manages authentication for the RTM client. |
| [opts.heartbeatInterval] | <code>integer</code> | <code>60000</code> | Interval, in milliseconds, to wait between heartbeat messages. |
| [opts.highWaterMark] | <code>integer</code> | <code>4194304</code> | 4MB. High water mark, in bytes, of the WebSocket write buffer. If the number of bytes queued in the WebSocket write buffer exceeds this value, the SDK sets [writeable](RTM#writeable) to <code>false</code>. |
| [opts.lowWaterMark] | <code>integer</code> | <code>2097152</code> | 2MB. Low water mark, in bytes, of the WebSocket write buffer. If the buffer rises above <code>highWaterMark</code> and then drops below <code>lowWaterMark</code>, the SDK sets [writeable](RTM#writeable) to <code>true</code>. |
| [opts.checkWritabilityInterval] | <code>integer</code> | <code>100</code> | Interval, in milliseconds, to check the queue length and update the <code>writable</code> property as necessary. |

**Example**  
```js
// create an RTM client
var rtm = new RTM('ENDPOINT', 'APPKEY');

// create a new subscription with 'your-channel' name
var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);

// add subscription data handlers

// the subscription receives any published message
subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});

// the client enters 'connected' state
rtm.on('enter-connected', function () {
  rtm.publish('your-channel', {key: 'value'});
});

// the client receives any PDU - PDU is passed as a parameter
rtm.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    rtm.restart();
  }
});

// start the client
rtm.start();
```
<a name="RTM+start"></a>

### RTM.start() ⇒ <code>void</code>
Starts the client.

The client begins to establish the WebSocket connection
to RTM and then tracks the state of the connection. If the WebSocket
connection drops for any reason, the JavaScript SDK attempts to reconnect.


Use [RTM.on(name, fn)](#Observer+on) to define application functionality,
for example, when the application enters or leaves the
<code>connecting</code> or <code>connected</code> states.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+stop"></a>

### RTM.stop() ⇒ <code>void</code>
Stops the client. The SDK begins to close the WebSocket connection and
does not start it again unless you call [start()](#RTM+start).

Use this method to explicitly stop all interaction with RTM.

Use [RTM.on(name, fn)](#Observer+on) to define application functionality,
for example, when the application enters or leaves the <code>stopped</code> state.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+restart"></a>

### RTM.restart() ⇒ <code>void</code>
Restarts the client.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
<a name="RTM+isStopped"></a>

### RTM.isStopped() ⇒ <code>boolean</code>
Returns <code>true</code> if the RTM client is in the <code>stopped</code> state.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>boolean</code> - <code>true</code> if the client is in the <code>stopped</code> state; false otherwise.  
<a name="RTM+isConnected"></a>

### RTM.isConnected() ⇒ <code>boolean</code>
Returns <code>true</code> if the client is in the <code>connected</code> state.

In this state, the WebSocket connection is established and any authentication
(if necessary) has successfully completed.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>boolean</code> - <code>true</code> if the client is in the <code>connected</code> state; false otherwise.  
<a name="RTM+getSubscription"></a>

### RTM.getSubscription(subscriptionId) ⇒ <code>[Subscription](#Subscription)</code>
Returns a [Subscription](#Subscription) object for the associated subscription id.
The <code>Subscription</code> object must exist.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>[Subscription](#Subscription)</code> - The [Subscription](#Subscription) object.  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| subscriptionId | <code>string</code> | Subscription id. |

<a name="RTM+subscribe"></a>

### RTM.subscribe(channelOrSubId, mode, [bodyOpts]) ⇒ <code>[Subscription](#Subscription)</code>
Creates a subscription to the specified channel.

When you create a channel subscription, you can specify additional properties,
for example, add a filter to the subscription and specify the
behavior of the SDK when resubscribing after a reconnection.

For more information about the options for a channel subscription,
see <strong>Subscribe PDU</strong> in the online docs.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Returns**: <code>[Subscription](#Subscription)</code> - - Subscription object.  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.

**See**

- [SIMPLE](#RTM.SubscriptionMode.SIMPLE)
- [RELIABLE](#RTM.SubscriptionMode.RELIABLE)
- [ADVANCED](#RTM.SubscriptionMode.ADVANCED)


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| channelOrSubId | <code>string</code> |  | String that identifies the channel. If you do not use the <code>filter</code> parameter, it is the channel name. Otherwise, it is a unique identifier for the channel (subscription id). |
| mode | <code>[SubscriptionMode](#RTM.SubscriptionMode)</code> |  | Subscription mode. This mode determines the behaviour of the Javascript SDK and RTM when resubscribing after a reconnection. For more information about the options for a subscription, see <strong>Subscribe PDU</strong> in the online docs. |
| [bodyOpts] | <code>object</code> | <code>{}</code> | Additional subscription options for a channel subscription. These options are sent to RTM in the <code>body</code> element of the Protocol Data Unit (PDU) that represents the subscribe request. For more information about the <code>body</code> element of a PDU, see <em>RTM API</em> in the online docs. |

**Example**  
```js
var rtm = new RTM('ENDPOINT', 'APPKEY');

// create a subscription with 'your-channel' name
var subscription = rtm.subscribe('your-channel', RTM.SubscriptionMode.SIMPLE);

// the subscription receives any published message
subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});

rtm.start();
```
**Example**  
```js
var rtm = new RTM('your-endpoint', 'your-appkey');

// subscribe to the channel named 'my-channel' using a filter
var subscription = rtm.subscribe('my-filter', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT * FROM my-channel WHERE object.param >= 1 OR object.id == 0',
});

// receive messages published to the channel
subscription.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(console.log);
});

// receive subscription data messages
subscription.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    rtm.restart();
  }
});

rtm.start();
```
<a name="RTM+resubscribe"></a>

### RTM.resubscribe(channelOrSubId, opts, [onCompleted]) ⇒ <code>void</code>
Updates an existing [Subscription](#Subscription) object. All event
handlers are copied to the updated object.

Use this method to change an existing subscription, for example,
to add or change a filter.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channelOrSubId | <code>string</code> | Subscription id or channel name of the existing subscription. |
| opts | <code>Object</code> | Properties for the updated <code>Subscription</code> object. See [RTM.subscribe(channelOrSubId, opts)](#RTM+subscribe) and the <em>RTM API</em> in the online docs for the supported property names. |
| [onCompleted] | <code>function</code> | Function to execute on the updated <code>Subscription</code> object, passed as a parameter. |

<a name="RTM+unsubscribe"></a>

### RTM.unsubscribe(subscriptionId, [onAck]) ⇒ <code>void</code>
Removes the specified subscription.

The response Protocol Data Unit (PDU) from the RTM is
passed as a parameter to the <code>onAck</code> function.

For more information, see <strong>Unsubscribe PDU</strong> in the
online docs.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| subscriptionId | <code>string</code> | Subscription id or channel name. |
| [onAck] | <code>function</code> | Function to execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

<a name="RTM+publish"></a>

### RTM.publish(channel, message, [onAck]) ⇒ <code>void</code>
Publishes a message to a channel. The [RTM](#RTM) client
must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel name. |
| message | <code>JSON</code> | JSON that represents the message payload to publish. |
| [onAck] | <code>function</code> | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

**Example**  
```js
rtm.publish('channel', {key: 'value'}, function (pdu) {
  if (!pdu.action.endsWith('/ok')) {
    console.log('something went wrong');
  }
});
```
<a name="RTM+read(1)"></a>

### RTM.read(channel, [onAck]) ⇒ <code>void</code>
Reads the latest message written to a specific channel, as a Protocol
Data Unit (PDU). The [RTM](#RTM) client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel name. |
| [onAck] | <code>function</code> | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

**Example**  
```js
rtm.read('channel', function (pdu) {
    console.log(pdu);
})
```
<a name="RTM+read(2)"></a>

### RTM.read(channel, [opts]) ⇒ <code>void</code>
Reads the latest message written to specific channel, as a Protocol
Data Unit (PDU).
The [RTM](#RTM) client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| channel | <code>string</code> |  | Channel name. |
| [opts] | <code>object</code> | <code>{}</code> | Additional <code>body</code> options for the read PDU. For more information, see <em>RTM API/em> in the online docs. |
| [opts.bodyOpts] | <code>object</code> | <code>{}</code> | Additional read request options. These options are sent to RTM in the <code>body</code> element of the PDU that represents the read request. |
| [opts.onAck] | <code>function</code> |  | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

**Example**  
```js
rtm.read('channel', {
  bodyOpts: { position: '1485444476:0' },
  onAck: function (pdu) {
    console.log(pdu);
  }
})
```
<a name="RTM+write"></a>

### RTM.write(channel, value, [onAck]) ⇒ <code>void</code>
Writes a value to the specified channel. The [RTM](#RTM) client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel name. |
| value | <code>JSON</code> | JSON that represents the message payload to publish. |
| [onAck] | <code>function</code> | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

**Example**  
```js
rtm.write('channel', 'value', function (pdu) {
    console.log(pdu);
})
```
<a name="RTM+delete"></a>

### RTM.delete(channel, [onAck]) ⇒ <code>void</code>
Deletes the value for the associated channel. The [RTM](#RTM) client must be connected.

**Kind**: instance method of <code>[RTM](#RTM)</code>  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| channel | <code>string</code> | Channel name. |
| [onAck] | <code>function</code> | Function to attach and execute on the response PDU from RTM. The response PDU is passed as a parameter to this function. RTM does not send a response PDU if a callback is not specified. |

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
Attaches an event handler function for named event.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+off"></a>

### RTM.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+fire"></a>

### RTM.fire(name) ⇒ <code>void</code>
Executes all handlers attached to the given event type.

The event <code>name</code> is one of the client or subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

**Kind**: instance method of <code>[RTM](#RTM)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |

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
The JavaScript SDK
tracks the <code>position</code> parameter and attempts to use that value when
resubscribing. If the <code>position</code> parameter is expired, RTM fast-forwards
to the earliest possible <code>position</code> value.

This option may result in missed messages if the application has a slow connection
to RTM and cannot keep up with the channel message data sent from RTM.

For more information about the fast-forward feature, see <em>RTM API</em> in the online docs.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.SubscriptionMode.SIMPLE"></a>

#### SubscriptionMode.SIMPLE : <code>[SubscriptionMode](#SubscriptionMode)</code>
The JavaScript SDK does not track the <code>position</code> parameter received from RTM.
Instead, when resubscribing following a reconnection, RTM fast-forwards to
the earliest possible <code>position</code> parameter value.

This option may result in missed messages during reconnection if the application has
a slow connection to RTM and cannot keep up with the channel message stream sent from RTM.

For more information about the fast-forward feature, see <em>RTM API</em> in the online docs.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.SubscriptionMode.ADVANCED"></a>

#### SubscriptionMode.ADVANCED : <code>[SubscriptionMode](#SubscriptionMode)</code>
The JavaScript SDK tracks the <code>position</code> parameter and always uses that value when
resubscribing.

If the stream position is expired when the SDK attempts to resubscribe, RTM
sends an <code>expired_position</code> error and unsubscribes.

If the application has
a slow connection to RTM and cannot keep up with the channel message data sent from RTM,
RTM sends an <code>out_of_sync</code> error and unsubscribes.

For more information about the <code>expired_position</code> and <code>out_of_sync</code>
errors, see <em>RTM API</em> in the online docs.

**Kind**: static constant of <code>[SubscriptionMode](#RTM.SubscriptionMode)</code>  
**Read only**: true  
<a name="RTM.roleSecretAuthProvider"></a>

### RTM.roleSecretAuthProvider(role, roleSecret, opts) ⇒ <code>function</code>
Creates an authentication provider for the the role-based authentication
method.

The role-based authentication method is a two-step authentication process
based on the HMAC process, using the MD5 hashing routine:
<ul>
<li>The client obtains a nonce from the server in a handshake request.</li>
<li>The client then sends an authorization request with its role secret key
hashed with the received nonce.</li>
</ul>
<br>
Obtain a role secret key from the Dev Portal for your application.

**Kind**: static method of <code>[RTM](#RTM)</code>  
**Returns**: <code>function</code> - Authentication provider for the role-based authentication method.  
**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| role | <code>string</code> |  | User role to authenticate with. |
| roleSecret | <code>string</code> |  | Role secret key from Dev Portal. |
| opts | <code>object</code> |  | Additional authentication options. |
| [opts.timeout] | <code>integer</code> | <code>30000</code> | Amount of time, in milliseconds, before the authentication operation times out. |

<a name="Subscription"></a>

## Subscription ⇐ <code>[Observer](#Observer)</code>
**Kind**: global class  
**Extends:** <code>[Observer](#Observer)</code>  

* [Subscription](#Subscription) ⇐ <code>[Observer](#Observer)</code>
    * [new Subscription(subscriptionId, opts)](#new_Subscription_new)
    * [.on(name, fn)](#Observer+on) ⇒ <code>void</code>
    * [.off(name, fn)](#Observer+off) ⇒ <code>void</code>
    * [.fire(name)](#Observer+fire) ⇒ <code>void</code>

<a name="new_Subscription_new"></a>

### new Subscription(subscriptionId, opts)
The <code>Subscription</code> class manages the state and events of a
subscription.

You can use the <code>Subscription</code> class to define application functionality
when specific events occur, like receiving a message, or when the subscription
enters different subscription state machine state.

When the application receives a message as subscription data, the <code>data</code>
event occurs and the received message is passed, as a Protocol Data Unit (PDU),
to the <code>fn</code> parameter of the
[Subscription.on(event, fn)](#Observer+on) event handler method.

Use the [Subscription.on(event, fn)](#Observer+on) method to add an
event handler to the subscription, which 'fires' when the subscription
receives a published message. The event parameter in this method can take a
value of <code>data</code> or the value of the action element of the PDU,
for example, <code>rtm/subscription/data</code>.

You can also set event handlers when the subscription enters or leaves
a state in the subscription state machine. A subscription can be in
one of the following states: <code>subscribing</code>, <code>subscribed</code>,
<code>unsubscribing</code>, <code>unsubscribed</code>, or <code>failed</code>.

See
<strong>State Machines</strong> in the online docs.

<strong>Note:</strong> When the connection from the RTM client to
RTM drops, all subscriptions are unsubscribed, and then resubscribed
when the connection is restored. You can direct the JavaScript SDK to automatically
reconnect or you can detect the disconnect manually and then reconnect to
RTM at the proper message stream position with the
<code>position</code> parameter.

**Throws**:

- <code>TypeError</code> <code>TypeError</code> indicates that mandatory
parameters are missing or invalid.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| subscriptionId | <code>string</code> |  | String that identifies the channel. If you do not use the <code>filter</code> parameter, it is the channel name. Otherwise, it is a unique identifier for the channel (subscription id). |
| opts | <code>Object</code> |  | Additional subscription options. |
| [opts.mode] | <code>boolean</code> |  | Sets subscription mode. Can be <code>SIMPLE</code>, <code>RELIABLE</code>, or <code>ADVANCED</code>. |
| [opts.bodyOpts] | <code>object</code> | <code>{}</code> | Additional subscription options for a channel subscription. These options are sent to RTM in the <code>body</code> element of the PDU that represents the subscribe request. For more information about the <code>body</code> element of a PDU, see <em>RTM API</em> in the online docs. |

**Example**  
```js
// create a new subscription to the 'your-channel' channel
var subscription = rtm.subscribe('your-channel');


subscription.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(console.log);
});
subscription.on('enter-subscribed', function () {
    rtm.publish('your-channel', {type: 'init'});
});
subscription.on('data', function (pdu) {
    if (pdu.action.endWith('/error')) {
        rtm.restart();
    }
});
```
<a name="Observer+on"></a>

### subscription.on(name, fn) ⇒ <code>void</code>
Attaches an event handler function for named event.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+off"></a>

### subscription.off(name, fn) ⇒ <code>void</code>
Removes an event handler.

The event <code>name</code> is one of the client or
subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

The Protocol Data Unit (PDU) for the event is passed to the
<code>fn</code> function parameter.

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |
| fn | <code>function</code> | Event handler function. |

<a name="Observer+fire"></a>

### subscription.fire(name) ⇒ <code>void</code>
Executes all handlers attached to the given event type.

The event <code>name</code> is one of the client or subscription state machine events,
for example, <code>data</code> or <code>enter-connected</code>
for the [RTM](#RTM) client or <code>enter-subscribed</code> for a
[Subscription](#Subscription) object.

**Kind**: instance method of <code>[Subscription](#Subscription)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Event name. |

<a name="SubscriptionMode"></a>

## SubscriptionMode : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| trackPosition | <code>boolean</code> | Tracks the stream position received from RTM. RTM includes the <code>position</code> parameter in responses to publish and subscribe requests and in subscription data messages. The SDK can attempt to resubscribe to the channel data stream from this position. |
| fastForward | <code>boolean</code> | RTM fast-forwards the subscription when the SDK resubscribes to a channel. |

