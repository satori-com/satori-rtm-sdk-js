var RTM = require('..');

var endpoint = '<ENDPOINT>';
var appkey = '<APPKEY>';
var roleSecretProvider = RTM.roleSecretAuthProvider('<ROLE>', '<ROLE_SECRET>');

var rtm = new RTM(endpoint, appkey, {
  authProvider: roleSecretProvider,
});

rtm.on('error', function (e) {
  console.log('Failed to connect', e);
});

rtm.on('authenticated', function () {
  console.log('Authenticated successfully!');
});

rtm.on('enter-connected', function () {
  console.log('Client is fully connected!');
});

rtm.start();
