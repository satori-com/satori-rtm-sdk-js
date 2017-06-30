var RTM = require('..');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';

var client = new RTM(endpoint, appkey);

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM!');

  var channelName = 'animals';
  var message = {
    who: 'zebra',
    where: [ 34.134358, -118.321506 ]
  };
  client.publish(channelName, message , function (pdu) {
    if (pdu.action === 'rtm/publish/ok') {
      console.log('Publish confirmed');
    } else {
      console.log('Failed to publish. RTM replied with the error ' +
          pdu.body.error + ': ' + pdu.body.reason);
    }
  });
});

client.on('error', function (error) {
  console.log('Failed to connect', error);
});

client.start();
