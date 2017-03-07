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
   * The event <code>name</code> is one of the client or
   * subscription state machine events,
   * for example, <code>data</code> or <code>enter-connected</code>
   * for the [RTM]{@link RTM} client or <code>enter-subscribed</code> for a
   * [Subscription]{@link Subscription} object.
   *
   * The Protocol Data Unit (PDU) for the event is passed to the
   * <code>fn</code> function parameter.
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
   * The event <code>name</code> is one of the client or
   * subscription state machine events,
   * for example, <code>data</code> or <code>enter-connected</code>
   * for the [RTM]{@link RTM} client or <code>enter-subscribed</code> for a
   * [Subscription]{@link Subscription} object.
   *
   * The Protocol Data Unit (PDU) for the event is passed to the
   * <code>fn</code> function parameter.
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
   * Executes all handlers attached to the given event type.
   *
   * The event <code>name</code> is one of the client or subscription state machine events,
   * for example, <code>data</code> or <code>enter-connected</code>
   * for the [RTM]{@link RTM} client or <code>enter-subscribed</code> for a
   * [Subscription]{@link Subscription} object.
   *
   * @param {string} name - Event name.
   *
   * @return {void}
   */
  fire: function (name) {
    var col = this.handlers[name] || [];
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    col.forEach(function (fn) {
      try {
        fn.apply(null, args);
      } catch (e) {
        logger.error(e);
      }
    });
  },
};

module.exports = Observer;
