var RTM = require('../rtm.js');
var path = require('path');
var fs = require('fs');

var connections = [];
var testEnvConfig;

function generateName(prefix) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var MAX_LENGTH = 5;
  var i;
  for (i = 0; i < MAX_LENGTH; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return prefix + text;
}

function subscriptionId() {
  return generateName('subscription-');
}

function channel() {
  return generateName('channel-');
}

function pipeline() {
  var checks = [];
  var isCompleted = false;
  var done = null;

  var pipe = {
    addCheck: function (fn) {
      checks.push(fn);
      return pipe;
    },
    doCheck: function () {
      var fn;
      if (isCompleted) {
        return pipe;
      }
      if (checks.length === 0) {
        throw new Error('Checks array is empty');
      }
      fn = checks.shift();
      fn.apply(this, arguments);
      if (checks.length === 0 && !isCompleted) {
        isCompleted = true;
      }
      if (done !== null && isCompleted) {
        done();
      }
      return pipe;
    },
    whenCompleted: function (doneFn) {
      done = doneFn;
      if (isCompleted) {
        done();
      }
      return pipe;
    },
  };
  return pipe;
}

function loadConfig(configPath) {
  var mandatoryFields = ['endpoint', 'appkey'];
  var config;
  try {
    fs.accessSync(configPath, fs.F_OK);
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    throw new Error('Can\'t find the credentials.json in the ROOT_DIR.' +
        ' See README for additional info');
  }
  mandatoryFields.forEach(function (field) {
    if (!config[field]) {
      throw new Error('"' + field + '" is not specified in ' + path);
    }
  });
  return config;
}

testEnvConfig = loadConfig(path.resolve(__dirname, '../../credentials.json'));

function rtm(endpoint, appkey, opts) {
  var _endpoint = endpoint || testEnvConfig.endpoint;
  var _appkey = appkey || testEnvConfig.appkey;
  var c = new RTM(_endpoint, _appkey, opts);
  connections.push(c);
  return c;
}

function teardown() {
  connections.forEach(function (c) {
    if (!c.isStopped()) {
      c.stop();
    }
  });
  connections = [];
}

function eq(expectation) {
  return function (v) {
    expect(v).toBe(expectation);
  };
}

module.exports = {
  pipeline: pipeline,
  subscriptionId: subscriptionId,
  channel: channel,
  teardown: teardown,
  rtm: rtm,
  config: testEnvConfig,
  eq: eq,
};
