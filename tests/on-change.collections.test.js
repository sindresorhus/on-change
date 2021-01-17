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
