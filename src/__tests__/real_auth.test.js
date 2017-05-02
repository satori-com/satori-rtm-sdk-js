/* eslint-disable vars-on-top */

jest.mock('../websocket.js');
jest.useRealTimers();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

var h = require('./helper.js');
var RTM = require('../rtm.js');

describe('real auth', function () {
  var p;

  beforeEach(function () {
    p = h.pipeline();
  });

  afterEach(function () {
    h.teardown();
  });

  it('authenticates successfully with role', function (done) {
    var roleSecretProvider = RTM.roleSecretAuthProvider(h.config.auth_role_name,
      h.config.auth_role_secret_key);

    var client = h.rtm(h.config.endpoint, h.config.appkey, {
      authProvider: roleSecretProvider,
    });
    client.on('authenticated', p.doCheck.bind(null, 'authenticated'));
    client.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));

    p.addCheck(h.eq('authenticated'));
    p.addCheck(h.eq('enter-connected'));
    p.whenCompleted(done);

    client.start();
  });

  it('authenticates unsuccessfully with incorrect key', function (done) {
    var roleSecretProvider = RTM.roleSecretAuthProvider(h.config.auth_role_name, 'bad_key');
    var client = h.rtm(h.config.endpoint, h.config.appkey, {
      authProvider: roleSecretProvider,
    });
    client.on('error', p.doCheck);
    client.on('authenticated', p.doCheck.bind(null, 'authenticated'));
    client.on('enter-awaiting', p.doCheck.bind(null, 'enter-awaiting'));
    client.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));

    p.addCheck(h.eq('enter-awaiting'));
    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('auth/authenticate/error');
    });
    p.whenCompleted(done);

    client.start();
  });

  it('receives an error when publish to restricted channel', function (done) {
    var client = h.rtm();
    client.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));

    p.addCheck(function (msg) {
      expect(msg).toBe('enter-connected');
      client.publish('channel', 'emulate-auth-required', function (pdu) {
        p.doCheck(pdu);
      });
    });
    p.addCheck(function (pdu) {
      expect(pdu.action).toBe('rtm/publish/error');
      expect(pdu.body.error).toBe('authentication_required');
    });
    p.whenCompleted(done);

    client.start();
  });

  it('should go to awaiting when handshake returned an error', function (done) {
    var roleSecretProvider = RTM.roleSecretAuthProvider('emulate-handshake-error', 'key');
    var client = h.rtm(h.config.endpoint, h.config.appkey, {
      authProvider: roleSecretProvider,
    });

    client.on('error', p.doCheck);
    client.on('enter-connected', p.doCheck.bind(null, 'enter-connected'));
    client.on('enter-awaiting', p.doCheck.bind(null, 'enter-awaiting'));

    p.addCheck(h.eq('enter-awaiting'));
    p.addCheck(function (msg) {
      expect(msg.action).toBe('auth/handshake/error');
    });
    p.whenCompleted(done);

    client.start();
  });
});

