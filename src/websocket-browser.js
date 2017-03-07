var _global = (function () {
  return this;
}());
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;

function W3CWebSocket(uri) {
  return new NativeWebSocket(uri);
}

module.exports = NativeWebSocket ? W3CWebSocket : null;
