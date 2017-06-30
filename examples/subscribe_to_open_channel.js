var RTM = require("satori-rtm-sdk");

var endpoint = 'wss://open-data.api.satori.com';
var appkey = 'YOUR_APPKEY';
var channelName = 'YOUR_CHANNEL'

var client = new RTM(endpoint, appkey);

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM!');
});

var subscription = client.subscribe(channel, RTM.SubscriptionMode.SIMPLE);

subscription.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (msg) {
    console.log('Got message:', msg);
  });
});

client.start();
