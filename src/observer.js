var logger = require('./logger.js');

/**
 * Creates an observer instance.
 * @class
 */
function Observer() {
  this.handlers = {};
}

Observer.prototype = {
  /**
   * Attaches an event handler function for named event.
   *
   * @param {string} name - Event name.
   *
   * @param {function} fn - Event handler function.
   *
   * @return {void}
   */
  on: function (name, fn) {
    if (!(name in this.handlers)) {
      this.handlers[name] = [];
    }
    this.handlers[name].push(fn);
  },

  /**
   * Removes an event handler.
   *
   * @param {string} name - Event name.
   *
   * @param {function} fn - Event handler function.
   *
   * @return {void}
   */
  off: function (name, fn) {
    if (!(name in this.handlers)) {
      return;
    }
    this.handlers[name] = this.handlers[name].filter(function (item) {
      return item !== fn;
    });
  },

  /**
   * Executes all handlers attached to the given named event.
   *
   * @param {string} name - Event name.
   * @param {...Object} args - Event arguments.
   *
   * @return {void}
   */
  fire: function () {
    var name;
    var fns;
    var i;
    var len = arguments.length;
    // Copy arguments to solve 'Not optimized: Bad value context for arguments value'
    // See https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358
    var args = new Array(len);
    for (i = 0; i < len; i += 1) {
      args[i] = arguments[i];
    }
    name = args.shift();

    fns = this.handlers[name] || [];
    fns.forEach(function (fn) {
      try {
        fn.apply(null, args);
      } catch (e) {
        logger.error(e);
      }
    });
  },
};

module.exports = Observer;
