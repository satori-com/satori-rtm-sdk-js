var RTM = require('..');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';

var client = new RTM(endpoint, appkey);

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM!');
});

function onSubscriptionData(pdu) {
  pdu.body.messages.forEach(function (msg) {
    if (pdu.body.subscription_id == "zebras") {
      console.log('Got a zebra:', JSON.stringify(msg));
    } else {
      console.log('Got a count:', JSON.stringify(msg));
    }
  });
}

var stats = client.subscribe('stats', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT count(*) as count, who FROM `animals` GROUP BY who',
});
stats.on('rtm/subscription/data', onSubscriptionData);

var zebras = client.subscribe('zebras', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT * FROM `animals` WHERE who = "zebra"',
});
zebras.on('rtm/subscription/data', onSubscriptionData);

client.start();
