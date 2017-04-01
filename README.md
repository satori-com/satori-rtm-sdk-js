JavaScript SDK for Satori Platform
==========

Use the JavaScript SDK for the Satori platform to create browser-based applications or server-based applications running within Node.js. The applications use the RTM to publish and subscribe.

## JavaScript SDK Installation

### Browser Installation

To use the JavaScript SDK from a browser-based application, include the SDK from the CDN and create an RTM client instance:

```HTML
<script src="https://satori-a.akamaihd.net/satori-sdk-js/v1.0.1/sdk.min.js"></script>
<script src="https://satori-a.akamaihd.net/satori-sdk-js/v1.0.1/sdk.js"></script>
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
npm install 'satori-sdk-js'
```

2. In your application file `<app_name>.js`, use the following code to create an RTM client instance:

```JavaScript
var RTMClient = require("satori-sdk-js");

// create an RTM client instance
var rtm = new RTMClient("your-endpoint", "your-appkey");
```

**Note**: You can find the application key and endpoint on the **Appkey Info** page for your app in the Developer Portal.

# JavaScript Sample Code

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

# Documentation

You can view the latest JavaScript SDK documentation [here](./API.md).

### Testing Your Changes

Tests require an active RTM Service to be available. The tests require `credentials.json` to be populated with the RTM Service properties.

The `credentials.json` file must include the following key-value pairs:

```
{
  "endpoint": "wss://<SATORI_HOST>/",
  "appkey": "<APP KEY>",
  "superuser_role_secret": "<ROLE SECRET KEY>"
}
```

* `endpoint` is your customer-specific DNS name for RTM Service access.
* `appkey` is your application key.
* `superuser_role_secret` is a role secret key for a role named `superuser`.

After setting up `credentials.json`, just type `npm test` at the command line.

### Assembling from sources

* git clone https://github.com/satori-com/satori-sdk-js.git
* cd satori-sdk-js
* npm install
* npm run build

The assembled JS output will appear in the `./dist/` directory.

### Generating API docs

* npm run docs

The generated API documentation will apear in the `./docs` folder.
