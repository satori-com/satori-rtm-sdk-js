/* eslint-disable no-console */

var hasConsole = console && console.log;

var logger = {
  DEBUG: false,
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
