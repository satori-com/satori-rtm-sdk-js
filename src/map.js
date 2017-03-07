var cMap;

if (typeof (Map) !== 'undefined' && 'forEach' in Map.prototype) {
  module.exports = Map;
} else {
  cMap = function () {
    this.storage = {
      keys: [],
      values: [],
    };
    this.size = 0;
  };

  /**
   * Sets a value for the specified key.
   *
   * @param {string} key - Key value.
   * @param {any} value - Stored value.
   *
   * @return {void}
   */
  cMap.prototype.set = function (key, value) {
    var index = this._index(key);
    if (index >= 0) {
      this.storage.values[index] = value;
    } else {
      this.storage.keys.push(key);
      this.storage.values.push(value);
    }

    this.size = this.storage.keys.length;
  };

  /**
   * Gets the value for specified key
   *
   * @param {string} key - Key value.
   *
   * @return {any} if key exists; {undefined} otherwise.
   */
  cMap.prototype.get = function (key) {
    var index = this._index(key);

    return index >= 0 ? this.storage.values[index] : undefined;
  };

  /**
   * Deletes the key and the associated key value.
   *
   * @param {string} key - Key value to delete.
   *
   * @return {void}
   */
  cMap.prototype.delete = function (key) {
    var index = this._index(key);
    if (index >= 0) {
      this.storage.keys.splice(index, 1);
      this.storage.values.splice(index, 1);
    }

    this.size = this.storage.keys.length;
  };

  /**
   * Clears Map values.
   *
   * @return {void}
   */
  cMap.prototype.clear = function () {
    this.storage.keys = [];
    this.storage.values = [];

    this.size = this.storage.keys.length;
  };

  cMap.prototype._index = function (key) {
    return this.storage.keys.indexOf(key);
  };

  module.exports = cMap;
}
