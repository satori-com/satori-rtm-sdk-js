var ws = require('ws');

function SandboxWebSocket() {
  ws.apply(this, arguments);
}

SandboxWebSocket.prototype = Object.create(ws.prototype);

SandboxWebSocket.prototype.async = function (fn) {
  setTimeout(function () {
    fn();
  }, 0);
};

SandboxWebSocket.prototype.asyncClose = function () {
  this.async(function () {
    this.close();
  }.bind(this));
};

SandboxWebSocket.prototype.asyncReply = function (json) {
  this.async(function () {
    var str = JSON.stringify(json);
    this.onmessage({ data: str });
  }.bind(this));
};

SandboxWebSocket.prototype.realSend = function () {
  ws.prototype.send.apply(this, arguments);
};

SandboxWebSocket.prototype.send = function (str) {
  var json = JSON.parse(str);
  var body = json.body || {};
  if (body.message === 'emulate-disconnect') {
    this.asyncClose();
  } else if (body.message && body.message.type === 'emulate-server-response') {
    this.asyncReply(body.message.response);
  } else if ((json.action === 'auth/handshake') && (body.data.role === 'emulate-handshake-error')) {
    this.asyncReply({
      id: json.id,
      action: 'auth/handshake/error',
      body: {
        error: 'handshake_failed',
        error_text: 'Handshake failed',
      },
    });
  } else if ((json.action === 'rtm/publish') && (body.message === 'emulate-auth-required')) {
    this.asyncReply({
      id: json.id,
      action: 'rtm/publish/error',
      body: {
        error: 'authentication_required',
        error_text: 'Authentication Required!',
      },
    });
  } else if ((json.action === 'rtm/publish') && (body.message === 'overflow-buffer-size')) {
    this.fakeBufferedAmount = (1024 * 1024 * 4) + 1;
  } else if ((json.action === 'rtm/publish') && (body.message === 'reset-buffer-size')) {
    this.fakeBufferedAmount = 0;
  } else {
    this.realSend(str);
  }
};

Object.defineProperty(SandboxWebSocket.prototype, 'bufferedAmount', {
  get: function () {
    return this.fakeBufferedAmount || 0;
  },
});

module.exports = SandboxWebSocket;
