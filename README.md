JavaScript SDK for Satori RTM
=============================================

Use the JavaScript SDK for the Satori RTM to create browser-based applications or server-based applications running within Node.js. The applications use the RTM to publish and subscribe.


JavaScript SDK Installation
---------------------------------------------------------------------

### Browser Installation

To use the JavaScript SDK from a browser-based application, include the SDK from the CDN and create an RTM client instance:

```HTML
<script src="https://satori-a.akamaihd.net/satori-rtm-sdk/v1.1.1/sdk.min.js"></script>
<script src="https://satori-a.akamaihd.net/satori-rtm-sdk/v1.1.1/sdk.js"></script>
```
and then

```JavaScript
// create an RTM client instance
var rtm = new RTM("YOUR_ENDPOINT", "YOUR_APPKEY");
```

Where `sdk.min.js` is the minified version and `sdk.js` is the full version.

**Note**: You can find the application key and endpoint on the **Appkey Info** page for your app in the Dev Portal.

### Node.js Installation

1. Install the JavaScript SDK with the following command from NPM:

```
npm install 'satori-rtm-sdk'
```

2. In your application file `<app_name>.js`, use the following code to create an RTM client instance:

```JavaScript
var RTM = require("satori-rtm-sdk");

// create an RTM client instance
var rtm = new RTM("YOUR_ENDPOINT", "YOUR_APPKEY");
```

**Note**: You can find the application key and endpoint on the **Appkey Info** page for your app in the Dev Portal.


JavaScript Sample Code
---------------------------------------------------------------------

```JavaScript
// create a new subscription with "your-channel" name
var channel = rtm.subscribe("your-channel", RTM.SubscriptionMode.SIMPLE);

// add channel data handlers

// channel receives any published message
channel.on("rtm/subscription/data", function(pdu) {
    pdu.body.messages.forEach(console.log);
});

// client enters 'connected' state
rtm.on("enter-connected", function() {
    rtm.publish("your-channel", {key: "value"});
});

// client receives any PDU and PDU is passed as a parameter
rtm.on("data", function(pdu) {
    if (pdu.action.endsWith("/error")) {
        rtm.restart();
    }
});

// start the client
rtm.start();
```

Documentation
---------------------------------------------------------------------

You can view the latest JavaScript SDK documentation [here](https://github.com/satori-com/satori-rtm-sdk-js/blob/v1.1.1/API.md).

#### Generating API docs

```bash
$ npm run docs
```

The generated API documentation will apear in the `./docs` folder.


Testing Your Changes
---------------------------------------------------------------------

Tests require an active RTM to be available. The tests require `credentials.json` to be populated with the RTM properties.

The `credentials.json` file must include the following key-value pairs:

```
{
  "endpoint": "YOUR_ENDPOINT",
  "appkey": "YOUR_APPKEY",
  "auth_role_name": "YOUR_ROLE",
  "auth_role_secret_key": "YOUR_SECRET",
  "auth_restricted_channel": "YOUR_RESTRICTED_CHANNEL"
}
```

* `endpoint` is your customer-specific DNS name for RTM access.
* `appkey` is your application key.
* `auth_role_name` is a role name that permits to publish / subscribe to `auth_restricted_channel`. Must be not `default`.
* `auth_role_secret_key` is a secret key for `auth_role_name`.
* `auth_restricted_channel` is a channel with subscribe and publish access for `auth_role_name` role only.

After setting up `credentials.json`, just type `npm test` at the command line.


Assembling from sources
---------------------------------------------------------------------

```bash
$ git clone https://github.com/satori-com/satori-rtm-sdk-js.git
$ cd satori-rtm-sdk
$ npm install
$ npm run build
```

The assembled JS output will appear in the `./dist/` directory.


Using HTTPS Proxy (NodeJS only)
---------------------------------------------------------------------
The SDK supports working through an https (not http) proxy.

When creating a new client specify `proxyAgent` in `options` like this:

```
var client = new RTM(endpoint, appKey, {
    proxyAgent: proxyAgent
});
```

Use any custom http.Agent implementation like:
* [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent#ws-websocket-connection-example)
* [socks-proxy-agent](https://github.com/TooTallNate/node-socks-proxy-agent#ws-websocket-connection-example)

NodeJS example with using `https-proxy-agent`:
```
var HttpsProxyAgent = require('https-proxy-agent');

var client = new RTM("YOUR_ENDPOINT", "YOUR_APPKEY", {
    proxyAgent: HttpsProxyAgent('http://127.0.0.1:3128')
});
```


Verbose logging of all incoming and outcoming PDUs
---------------------------------------------------------------------

You can enable dumping of all PDUs either from your code

```JavaScript
var RTM = require("satori-rtm-sdk");
RTM.logger.DEBUG = true;

// create an RTM client instance
var rtm = new RTM("YOUR_ENDPOINT", "YOUR_APPKEY");
```

or by setting DEBUG_SATORI_SDK environment variable prior to running your application

```JavaScript
$ export DEBUG_SATORI_SDK=true
$ node myapp.js
```
