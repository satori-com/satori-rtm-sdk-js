JavaScript SDK for Satori RTM
=============================================

Use the JavaScript SDK for the Satori RTM to create browser-based applications or server-based applications running within Node.js. The applications use the RTM to publish and subscribe.


JavaScript SDK Installation
---------------------------------------------------------------------

### Browser Installation

To use the JavaScript SDK from a browser-based application, include the SDK from the CDN and create an RTM client instance:

```HTML
<script src="https://satori-a.akamaihd.net/satori-rtm-sdk/v1.0.2/sdk.min.js"></script>
<script src="https://satori-a.akamaihd.net/satori-rtm-sdk/v1.0.2/sdk.js"></script>
```
and then

```JavaScript
// create an RTM client instance
var rtm = new RTM("your-endpoint", "your-appkey");
```

Where `sdk.min.js` is the minified version and `sdk.js` is the full version. For the rest of the code, see [Sample Code](#code).

**Note**: You can find the application key and endpoint on the **Appkey Info** page for your app in the Developer Portal.

### Node.js Installation

1. Install the JavaScript SDK with the following command from NPM:

```
npm install 'satori-rtm-sdk'
```

2. In your application file `<app_name>.js`, use the following code to create an RTM client instance:

```JavaScript
var RTMClient = require("satori-rtm-sdk");

// create an RTM client instance
var rtm = new RTMClient("your-endpoint", "your-appkey");
```

**Note**: You can find the application key and endpoint on the **Appkey Info** page for your app in the Developer Portal.


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

You can view the latest JavaScript SDK documentation [here](./API.md).

#### Generating API docs

```bash
$ npm run docs
```

The generated API documentation will apear in the `./docs` folder.


Testing Your Changes
---------------------------------------------------------------------

Tests require an active RTM Service to be available. The tests require `credentials.json` to be populated with the RTM Service properties.

The `credentials.json` file must include the following key-value pairs:

```
{
  "endpoint": "wss://<SATORI_HOST>/",
  "appkey": "<APP_KEY>",
  "auth_role_name": "<ROLE_NAME>",
  "auth_role_secret_key": "<ROLE_SECRET_KEY>",
  "auth_restricted_channel": "<CHANNEL_NAME>"
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


Verbose logging of all incoming and outcoming PDUs
---------------------------------------------------------------------

You can enable dumping of all PDUs either from your code

```JavaScript
var RTMClient = require("satori-rtm-sdk");
RTMClient.logger.DEBUG = true;

// create an RTM client instance
var rtm = new RTMClient("your-endpoint", "your-appkey");
```

or by setting DEBUG_SATORI_SDK environment variable prior to running your application

```JavaScript
$ export DEBUG_SATORI_SDK=true
$ node myapp.js
```