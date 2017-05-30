var RTM = require("satori-rtm-sdk");

var endpoint = 'wss://open-data.api.satori.com';
var appkey = 'YOUR_APPKEY';
var channelName = 'YOUR_CHANNEL'

var rtm = new RTM(endpoint, appkey);

rtm.on('enter-connected', function () {
  console.log('Connected to RTM!');
});

var channel = rtm.subscribe(channelName, RTM.SubscriptionMode.SIMPLE);

channel.on('enter-subscribed', function () {
  console.log('Subscribed to: ' + channel.subscriptionId);
  console.log('Press CTRL-C to exit');
});

channel.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (message) {
    console.log(message);
  });
});

channel.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    console.log('Subscription is failed: ', pdu.body);
  }
});

rtm.start();
