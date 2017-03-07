// Redefine prototype method to use custom Map implementation
var CMap;
var gMap = global.Map;

global.Map = function () {};
CMap = require('../map.js');

global.Map = gMap;

describe('map', function () {
  it('check single set/get', function () {
    var map = new CMap();
    map.set('test', 1);
    expect(map.get('test')).toBe(1);
  });

  it('check multiple set/get', function () {
    var map = new CMap();
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    expect(map.get('b')).toBe(2);
  });

  it('check delete', function () {
    var map = new CMap();
    map.set('a', 1);
    map.set('b', 2);

    expect(map.get('a')).toBe(1);
    map.delete('a');
    expect(map.get('a')).toBe(undefined);
  });

  it('check non-existing', function () {
    var map = new CMap();
    expect(map.get('asdasd')).toBe(undefined);
  });

  it('check duplicates', function () {
    var map = new CMap();
    map.set('a', 1);
    map.set('a', 'b');
    map.set('a', true);
    expect(map.get('a')).toBe(true);
    expect(map.size).toBe(1);
  });

  it('check clearing map', function () {
    var map = new CMap();
    map.set('a', 1);
    map.set('b', 2);
    expect(map.size).toBe(2);

    map.clear();
    expect(map.size).toBe(0);
  });
});
