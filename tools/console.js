var fs = require('fs');
var RTM = require('./src/rtm.js');

var configPath = './credentials.json';

fs.accessSync(configPath, fs.F_OK);
var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

RTM.logger.DEBUG = true;

var rtm = new RTM(config.endpoint, config.appkey);

rtm.start();

