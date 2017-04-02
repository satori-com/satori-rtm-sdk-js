var RTM = require('..');

var endpoint = '<ENDPOINT>';
var appkey = '<APPKEY>';

var rtm = new RTM(endpoint, appkey);

rtm.on('enter-connected', function () {
  console.log('Connected to RTM!');
});

var channel = rtm.subscribe('mychannel', RTM.SubscriptionMode.SIMPLE);

channel.on('enter-subscribed', function () {
  rtm.publish('mychannel', { name: 'Mike', age: 19 });
});

/* set callback for PDU with specific action */
channel.on('rtm/subscription/data', function (pdu) {
  pdu.body.messages.forEach(function (user) {
    console.log('Got user: ' + user.name + ' ' + user.age);
  });
});


rtm.start();

