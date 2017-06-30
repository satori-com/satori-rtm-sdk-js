var RTM = require('satori-rtm-sdk');

var endpoint = 'YOUR_ENDPOINT';
var appkey = 'YOUR_APPKEY';
var role = 'YOUR_ROLE';
var roleSecret = 'YOUR_SECRET';

var roleSecretProvider = RTM.roleSecretAuthProvider(role, roleSecret);
var client = new RTM(endpoint, appkey, {
  authProvider: roleSecretProvider,
});

client.on('error', function (e) {
  console.log('Error occurred', e);
});

client.on('enter-connected', function () {
  console.log('Connected to Satori RTM and authenticated as ' + role);
});

client.start();
