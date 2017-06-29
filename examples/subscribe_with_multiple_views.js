var RTM = require('..');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';

var client = new RTM(endpoint, appkey);

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM!');
});

var stats = client.subscribe('stats', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT count(*) as count, who FROM `animals` GROUP BY who',
});

var zebras = client.subscribe('zebras', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT * FROM `animals` WHERE who = "zebra"',
});

[stats, zebras].forEach(function (sub) {
  /* set callback for state transition */
  sub.on('enter-subscribed', function () {
    console.log('Subscribed to: ' + sub.subscriptionId);
  });

  sub.on('leave-subscribed', function () {
    console.log('Unsubscribed from: ' + sub.subscriptionId);
  });

  /* set callback for PDU with specific action */
  sub.on('rtm/subscription/data', function (pdu) {
    pdu.body.messages.forEach(function (msg) {
      console.log('Got message:', msg);
    });
  });

  sub.on('rtm/subscribe/error', function (pdu) {
    console.log('Failed to subscribe. RTM replied with the error ' +
        pdu.body.error + ': ' + pdu.body.reason);
  });

  sub.on('rtm/subscription/error', function (pdu) {
    console.log('Subscription failed. RTM sent the unsolicited error ' +
        pdu.body.error + ': ' + pdu.body.reason);
  });
});

client.start();
