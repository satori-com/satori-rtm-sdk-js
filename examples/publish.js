var RTM = require('..');

var endpoint = '<ENDPOINT>';
var appkey = '<APPKEY>';

var rtm = new RTM(endpoint, appkey);

rtm.on('enter-connected', function () {
  console.log('Connected to RTM!');

  // publish without acknowledge
  rtm.publish('mychannel', 'message');

  // publish with acknowledge from RTM
  rtm.publish('mychannel', { foo: 'bar' }, function (pdu) {
    if (pdu.action === 'rtm/publish/ok') {
      console.log('Message published successfully');
    } else {
      console.log('Failed to publish');
    }
  });
});

rtm.start();
