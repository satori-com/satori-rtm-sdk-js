var RTM = require('..');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';
var role = 'YOUR_ROLE';
var roleSecret = 'YOUR_SECRET';

var roleSecretProvider = RTM.roleSecretAuthProvider('YOUR_ROLE', 'YOUR_SECRET');
var client = new RTM(endpoint, appkey, {
  authProvider: roleSecretProvider,
});

client.on('error', function (e) {
  console.log('Failed to connect', e);
});

client.on('enter-connected', function () {
  console.log('Connected and authenticated successfully');
});

client.start();
