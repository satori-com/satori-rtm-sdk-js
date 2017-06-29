var RTM = require('..');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';

var client = new RTM(endpoint, appkey);

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM!');
});

var channelName = 'animals';
var channel = client.subscribe(channelName, RTM.SubscriptionMode.SIMPLE, {
  history: { age: 60 /* seconds */ },
});

/* set callback for state transition */
channel.on('enter-subscribed', function () {
  console.log('Subscribed to: ' + channel.subscriptionId);
});

channel.on('leave-subscribed', function () {
  console.log('Unsubscribed from: ' + channel.subscriptionId);
});

/* set callback for PDU with specific action */
channel.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (msg) {
    console.log('Got message:', msg);
  });
});

channel.on('rtm/subscribe/error', function (pdu) {
  console.log('Failed to subscribe. RTM replied with the error ' +
      pdu.body.error + ': ' + pdu.body.reason);
});

channel.on('rtm/subscription/error', function (pdu) {
  console.log('Subscription failed. RTM sent the unsolicited error ' +
      pdu.body.error + ': ' + pdu.body.reason);
});

client.start();
