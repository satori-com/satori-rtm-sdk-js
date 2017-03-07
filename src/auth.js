var hmac = require('crypto-js/hmac-md5');
var base64 = require('crypto-js/enc-base64');
var objectAssign = require('object-assign');

var AUTH_METHOD = 'role_secret';

function hmacMd5(message, key) {
  var h = hmac(message, key);
  return base64.stringify(h);
}

function success(state) {
  clearTimeout(state.timerId);
  state.onsuccess();
}

function fail(state, reason) {
  clearTimeout(state.timerId);
  state.onfail(reason);
}

function send(request, state, onSuccess) {
  state.rtm._unsafeSend(request, function (pdu) {
    try {
      if (pdu.action.endsWith('/ok')) {
        onSuccess(pdu);
      } else {
        fail(state, pdu);
      }
    } catch (e) {
      fail(state, e);
    }
  });
}

function authenticate(state, nonce) {
  var hash = hmacMd5(nonce, state.roleSecret);
  var request = {
    action: 'auth/authenticate',
    body: {
      method: AUTH_METHOD,
      credentials: { hash: hash },
    },
  };
  send(request, state, success.bind(null, state));
}

function handshake(state) {
  var request = {
    action: 'auth/handshake',
    body: {
      method: AUTH_METHOD,
      data: { role: state.role },
    },
  };
  send(request, state, function (pdu) {
    var nonce = pdu.body.data.nonce;
    authenticate(state, nonce);
  });
}

function roleSecretAuthProvider(role, roleSecret, opts) {
  var defaults = { timeout: 30000 };
  if (typeof role !== 'string') {
    throw new TypeError('"role" is missing or invalid');
  }
  if (typeof roleSecret !== 'string') {
    throw new TypeError('"roleSecret" is missing or invalid');
  }
  return function (rtm, onsuccess, onfail) {
    var state = objectAssign(defaults, opts, {
      rtm: rtm,
      role: role,
      handshakeReply: null,
      onsuccess: onsuccess,
      onfail: onfail,
      roleSecret: roleSecret,
    });

    var timerId = setTimeout(function () {
      fail(state, new Error('authentication timeout'));
    }, state.timeout);
    state.timerId = timerId;

    handshake(state);
  };
}

module.exports = {
  hmacMd5: hmacMd5,
  roleSecretAuthProvider: roleSecretAuthProvider,
};
