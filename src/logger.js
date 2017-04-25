/* eslint-disable no-console */

var logger;
var hasConsole = console && console.log;
var debugMode = false;

if (typeof process !== 'undefined' && 'DEBUG_SATORI_SDK' in process.env) {
  debugMode = process.env.DEBUG_SATORI_SDK.toLowerCase() === 'true';
}

logger = {
  DEBUG: debugMode,
  error: function (error) {
    if (hasConsole) {
      console.log.apply(console, arguments);
      if (error.stack) {
        console.log(error.stack);
      }
    }
  },
  warn: function () {
    if (hasConsole) {
      console.warn.apply(console, arguments);
    }
  },
  debug: function () {
    if (logger.DEBUG && hasConsole) {
      console.log.apply(console, arguments);
    }
  },
};

module.exports = logger;
