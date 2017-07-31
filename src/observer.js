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
   * Attaches an event handler function for the event specified in <code>name</code>.
   *
   * The event is usually related to a client or subscription state. It may also be an event
   * that occurs when the client or subscription receives information from RTM. For example, the
   * the following are [RTM]{@link RTM} client events:
   * <ul>
   *     <li><code>data:</code> The client received a PDU from RTM.</li>
   *     <li><code>enter-connected:</code> The client is now connected to RTM.</li>
   * </ul>
   * A possible event for a [Subscription]{@link Subscription} is <code>enter-subscribed</code>.
   *
   * The <code>fn</code> parameter is a function that's invoked when the event occurs. The PDU for
   * the event is passed to this function.
   *
   * @param {string} name - event name
   *
   * @param {function} fn - event handler function
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
   * The event specified in <code>name</code> is an [RTM]{@link RTM} or
   * [Subscription]{@link Subscription} event that has an attached event handler function
   * (see the <code>on()</code> function).
   *
   * The Protocol Data Unit (PDU) for the event is passed to the
   * <code>fn</code> function parameter.
   *
   * @param {string} name - event name
   *
   * @param {function} fn - event handler function
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
   * Executes all handlers attached for the specified event type.
   *
   * The event specified in <code>name</code> is an [RTM]{@link RTM} or
   * [Subscription]{@link Subscription} event that has an attached event handler function
   * (see the <code>on()</code> function).
   *
   * @param {string} name - name of an event that has attached handlers
   * @param {...Object} args - event arguments.
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
