const onChange = require('..');
const test = require('ava');
const {testRunner, setOnChange} = require('./helpers/test-runner');

setOnChange(onChange);

test('should handle shallow changes to Sets', t => {
	const object = {a: 0};
	const set = new Set();

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.a = set;
		t.true(proxy.a instanceof Set);
		verify(1, proxy, 'a', set, 0);

		let clone = new Set(set);
		proxy.a.add(32);
		verify(2, proxy, 'a', set, clone, {
			name: 'add',
			args: [32],
			result: proxy.a
		});

		clone = new Set(set);
		proxy.a.add(64);
		verify(3, proxy, 'a', set, clone, {
			name: 'add',
			args: [64],
			result: proxy.a
		});

		clone = new Set(set);
		proxy.a.delete(32);
		verify(4, proxy, 'a', set, clone, {
			name: 'delete',
			args: [32],
			result: true
		});

		proxy.a.delete(32);
		verify(4, proxy, 'a', set, clone, {
			name: 'delete',
			args: [32],
			result: true
		});

		clone = new Set(set);
		proxy.a.clear();
		verify(5, proxy, 'a', set, clone, {
			name: 'clear',
			args: [],
			result: undefined
		});
	});
});

test('should NOT trigger when set.has is called', t => {
	const object = {a: 2};
	const set = new Set([{a: 1}, object]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		t.true(proxy.has(object));

		verify(0);

		t.false(proxy.has({}));

		verify(0);
	});
});

test('should return a number for set.size', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		t.is(proxy.size, 2);

		verify(0);
	});
});

test('should trigger when set.add is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		proxy.add({b: 2});

		verify(
			1,
			proxy,
			[],
			new Set([{a: 1}, {a: 2}, {b: 2}]),
			new Set([{a: 1}, {a: 2}]),
			{
				args: [{b: 2}],
				name: 'add',
				result: new Set([{a: 1}, {a: 2}, {b: 2}])
			}
			);
	});
});

test('should trigger when set.clear is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		proxy.clear();

		verify(
			1,
			proxy,
			[],
			new Set(),
			new Set([{a: 1}, {a: 2}]),
			{
				args: [],
				name: 'clear',
				result: undefined
			}
			);
	});
});

test('should NOT trigger when set.clear is called on empty set', t => {
	const set = new Set();

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		proxy.clear();

		verify(0);
	});
});

test('should NOT trigger when set.delete is called on an empty set', t => {
	const object = {a: 2};
	const set = new Set();

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		proxy.delete(object);

		verify(0);
	});
});

test('should trigger when set.delete is called', t => {
	const object = {a: 2};
	const set = new Set([{a: 1}, object]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		proxy.delete(object);

		verify(
			1,
			proxy,
			[],
			new Set([{a: 1}]),
			new Set([{a: 1}, object]),
			{
				args: [object],
				name: 'delete',
				result: true
			}
			);
	});
});

test('should trigger when a change happens in set.forEach', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		const forEachCallback = entry => {
			entry.a++;
		};
		proxy.forEach(forEachCallback);

		verify(
			1,
			proxy,
			[],
			new Set([{a: 2}, {a: 3}]),
			new Set([{a: 1}, {a: 2}]),
			{
				args: [forEachCallback],
				name: 'forEach',
				result: undefined
			}
		);
	});
});

test('should handle the spread operator on Sets', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		const array = [...proxy];

		verify(0);

		t.deepEqual(array, [{a: 1}, {a: 2}]);
	});
});

test('should return an iterator when Set[Symbol.iterator] is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		for (const entry of proxy[Symbol.iterator]()) {
			entry.a++;
		}

		verify(2, proxy, [{a: 3}, 'a'], 3, 2);
	});
});

test('should return an iterator when Set.keys is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		for (const key of proxy.keys()) {
			key.a++;
		}

		verify(2, proxy, [{a: 3}, 'a'], 3, 2);
	});
});

test('should return an iterator when Set.entries is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		for (const entry of proxy.entries()) {
			entry[1].a++;
		}

		verify(2, proxy, [{a: 3}, 'a'], 3, 2);
	});
});

test('should return an iterator when Set.values is called', t => {
	const set = new Set([{a: 1}, {a: 2}]);

	testRunner(t, set, {pathAsArray: true}, (proxy, verify) => {
		for (const entry of proxy.values()) {
			entry.a++;
		}

		verify(2, proxy, [{a: 3}, 'a'], 3, 2);
	});
});

test('should handle shallow changes to WeakSets', t => {
	const object = {a: 0};
	const set = new WeakSet();
	const setObject = {x: 2};

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.a = set;
		t.true(proxy.a instanceof WeakSet);
		verify(1, proxy, 'a', set, 0);

		proxy.a.add(setObject);
		verify(2, proxy, 'a', set, undefined, {
			name: 'add',
			args: [setObject],
			result: set
		});

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', set, undefined, {
			name: 'delete',
			args: [setObject],
			result: true
		});

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', set, undefined, {
			name: 'delete',
			args: [setObject],
			result: true
		});
	});
});

test('should handle shallow changes to Maps', t => {
	const object = {a: 0};
	const map = new Map();

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.a = map;
		t.true(proxy.a instanceof Map);
		verify(1, proxy, 'a', map, 0);

		let clone = new Map(map);
		proxy.a.set(32, true);
		verify(2, proxy, 'a', map, clone, {
			name: 'set',
			args: [32, true],
			result: proxy.a
		});

		clone = new Map(map);
		proxy.a.delete(32);
		verify(3, proxy, 'a', map, clone, {
			name: 'delete',
			args: [32],
			result: true
		});

		proxy.a.delete(32);
		verify(3, proxy, 'a', map, clone, {
			name: 'delete',
			args: [32],
			result: true
		});
	});
});

test('should NOT trigger when map.has is called', t => {
	const object = {a: 0};
	const map = new Map();
	map.set(object, 1);

	testRunner(t, map, {}, (proxy, verify) => {
		t.true(proxy.has(object));
		verify(0);
		t.false(proxy.has({}));
		verify(0);

	});
});

test('should return a number for map.size', t => {
	const object = {a: 0};
	const map = new Map();
	map.set(object, 1);

	testRunner(t, map, {}, (proxy, verify) => {
		t.is(proxy.size, 1);
		verify(0);
	});
});

test('should trigger when a value returned from map.get is modified', t => {
	const object = {a: 0};
	const value = {b: 0};
	const map = new Map();
	map.set(object, value);

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		const wrappedValue = proxy.get(object);

		wrappedValue.b++;

		verify(1, proxy, [object, 'b'], 1, 0);

	});
});

test('should trigger when a value is modified in map.forEach', t => {
	const object = {a: 0};
	const value = {b: 0};
	const map = new Map();
	map.set(object, value);

	const earlyClone = new Map();
	earlyClone.set(object, { ...value });

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		const forEachCallback = value => value.b++;
		proxy.forEach(forEachCallback);

		const lateClone = new Map(proxy);

		verify(1, proxy, [], lateClone, earlyClone, {
			args: [forEachCallback],
			name: 'forEach',
			result: undefined
		});
	});
});

test('should trigger when map.clear is called', t => {
	const object = {a: 0};
	const map = new Map();
	map.set(object, 1);

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		const clone = new Map(map);

		proxy.clear();

		verify(1, proxy, [], new Map(), clone, {
			args: [],
			name: 'clear',
			result: undefined
		});

	});
});

test('should return an iterator when Map[Symbol.iterator] is called', t => {
	const object = {a: 1};
	const map = new Map();
	map.set(object, 1);

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		for (const entry of proxy[Symbol.iterator]()) {
			entry[0].a++;
		}

		verify(1, proxy, [object, 'a'], 2, 1);
	});
});

test('should return an iterator when Map.keys is called', t => {
	const object = {a: 1};
	const map = new Map();
	map.set(object, 1);

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		for (const key of proxy.keys()) {
			key.a++;
		}

		verify(1, proxy, [object, 'a'], 2, 1);
	});
});

test('should return an iterator when Map.entries is called', t => {
	const object = {};
	const map = new Map();
	map.set(object, {y: 1});

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		for (const entry of proxy.entries()) {
			entry[1].y++;
		}

		verify(1, proxy, [object, 'y'], 2, 1);
	});
});

test('should return an iterator when Map.values is called', t => {
	const object = {};
	const map = new Map();
	map.set(object, {y: 1});

	testRunner(t, map, {pathAsArray: true}, (proxy, verify) => {
		for (const value of proxy.values()) {
			value.y++;
		}

		verify(1, proxy, [object, 'y'], 2, 1);
	});
});

test('should handle shallow changes to WeakMaps', t => {
	const object = {a: 0};
	const map = new WeakMap();
	const setObject = {x: 2};

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.a = map;
		t.true(proxy.a instanceof WeakMap);
		verify(1, proxy, 'a', map, 0);

		proxy.a.set(setObject, true);
		verify(2, proxy, 'a', map, undefined, {
			name: 'set',
			args: [setObject, true],
			result: map
		});

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', map, undefined, {
			name: 'delete',
			args: [setObject],
			result: true
		});

		proxy.a.delete(32);
		verify(3, proxy, 'a', map, undefined, {
			name: 'delete',
			args: [setObject],
			result: true
		});
	});
});
