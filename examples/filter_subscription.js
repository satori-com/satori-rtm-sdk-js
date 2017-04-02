var RTM = require('..');

var endpoint = '<ENDPOINT>';
var appkey = '<APPKEY>';

var rtm = new RTM(endpoint, appkey);

rtm.on('enter-connected', function () {
  console.log('Connected to RTM!');
});

var channel = rtm.subscribe('group_by', RTM.SubscriptionMode.SIMPLE, {
  filter: 'SELECT a, MAX(b) FROM mychannel GROUP BY a',
});

/* set callback for state transition */
channel.on('enter-subscribed', function () {
  console.log('Subscribed to: ' + channel.subscriptionId);
  rtm.publish('mychannel', { a: 1, b: 2 });
});

/* set callback for PDU with specific action */
channel.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (msg) {
    console.log('Got message: ', msg);
  });
});

/* set callback for all subscription PDUs */
channel.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    console.log('Subscription is failed: ', pdu.body);
  }
});

rtm.start();
