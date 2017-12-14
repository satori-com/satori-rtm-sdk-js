var _global = (function () {
  return this || window;
}());
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;

function W3CWebSocket(uri, protocols) {
  return new NativeWebSocket(uri, protocols);
}

module.exports = NativeWebSocket ? W3CWebSocket : null;
