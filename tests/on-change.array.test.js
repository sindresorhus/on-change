import test from 'ava';
import onChange from '../source/index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';
import {typedArrays} from './helpers/data-types.js';

setOnChange(onChange);

test('should trigger once when an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy[0] = 'a';
		verify(1, proxy, '0', 'a', 1, undefined, ['a', 2, {a: false}]);
	});
});

test('should trigger once when a property of an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy[2].a = true;
		verify(1, proxy, '2.a', true, false, undefined, [1, 2, {a: true}]);
	});
});

test('should trigger once when an array is sorted with an array as the main object', t => {
	const object = [2, 3, 1];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.sort();
		verify(1, proxy, '', [1, 2, 3], [2, 3, 1], {
			name: 'sort',
			args: [],
			result: proxy,
		}, [1, 2, 3]);
	});
});

test('should trigger once when an array is popped with an array as the main object', t => {
	const object = [2, 3, 1];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.pop();
		verify(1, proxy, '', [2, 3], [2, 3, 1], {
			name: 'pop',
			args: [],
			result: 1,
		}, [2, 3]);
	});
});

test('should trigger once when an array is reversed with an array as the main object', t => {
	const object = [2, 3, 1];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.reverse();
		verify(1, proxy, '', [1, 3, 2], [2, 3, 1], {
			name: 'reverse',
			args: [],
			result: proxy,
		}, [1, 3, 2]);
	});
});

test('should trigger once when an array is spliced with an array as the main object', t => {
	const object = [2, 3, 1];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.splice(1, 1, 'a', 'b');
		verify(1, proxy, '', [2, 'a', 'b', 1], [2, 3, 1], {
			name: 'splice',
			args: [1, 1, 'a', 'b'],
			result: [3],
		}, [2, 'a', 'b', 1]);
	});
});

test('should not call the callback for nested items of an array if isShallow is true', t => {
	const array = [{z: 0}];

	testRunner(t, array, {isShallow: true}, (proxy, verify) => {
		proxy[0].z = 1;
		verify(0);

		proxy.unshift('a');
		verify(1, proxy, '', ['a', {z: 1}], [{z: 1}], {
			name: 'unshift',
			args: ['a'],
			result: 2,
		});
	});
});

test('should call the callback for items returned from a handled method on array', t => {
	const array = [{z: 0}, {z: 1}];

	testRunner(t, array, {}, (proxy, verify) => {
		const returned = [...proxy];
		verify(0);

		returned[0].z = 3;
		verify(1, proxy, '0.z', 3, 0);
	});
});

test('should call the callback for items returned from a non-handled method on array', t => {
	const array = [{z: 0}, {z: 1}];

	testRunner(t, array, {}, (proxy, verify) => {
		const returned = proxy.map(item => item);
		verify(0);

		returned[0].z = 3;
		verify(1, proxy, '0.z', 3, 0);
	});
});

test('should only execute once if map is called within callback', t => {
	let count = 0;

	const object = {
		arr: [],
		foo: true,
	};

	const proxy = onChange(object, function () {
		count++;
		this.arr.map(item => item);
	});

	proxy.arr.unshift('value');

	t.is(count, 1);
});

test('should return an array iterator when array[Symbol.iterator] is called', t => {
	const array = [{a: 1}, {a: 2}];

	testRunner(t, array, {}, (proxy, verify) => {
		for (const entry of proxy[Symbol.iterator]()) {
			entry.a++;
		}

		verify(2, proxy, '1.a', 3, 2);
	});
});

test('should return an array iterator when array.keys is called', t => {
	const array = [{a: 1}, {a: 2}];

	testRunner(t, array, {}, (proxy, verify) => {
		for (const key of proxy.keys()) {
			proxy[key].a++;
		}

		verify(2, proxy, '1.a', 3, 2);
	});
});

test('should return an array iterator when array.entries is called', t => {
	const array = [{a: 1}, {a: 2}];

	testRunner(t, array, {}, (proxy, verify) => {
		for (const entry of proxy.entries()) {
			entry[1].a++;
		}

		verify(2, proxy, '1.a', 3, 2);
	});
});

test('should return an array iterator when array.values is called', t => {
	const array = [{a: 1}, {a: 2}];

	testRunner(t, array, {}, (proxy, verify) => {
		for (const entry of proxy.values()) {
			entry.a++;
		}

		verify(2, proxy, '1.a', 3, 2);
	});
});

test('should unwrap proxies passed to immutable methods on array', t => {
	const item = {a: 1};
	const object = {
		b: item,
		c: [],
	};

	const proxy = onChange(object, () => {});

	proxy.c.push(proxy.b);

	t.is(proxy.c[0], proxy.b);
	t.is(proxy.c.indexOf(item), 0);
	t.is(proxy.c.indexOf(proxy.c[0]), 0);

	proxy.c[1] = proxy.b;

	t.is(proxy.c[1], proxy.b);
});

test('indexOf should work correctly after filter and reassignment - issue #106', t => {
	const object = {a: []};
	const proxy = onChange(object, () => {});

	proxy.a = [{a: 1}, {a: 2}, {a: 3}];

	// Pre-filter check - should work
	t.is(proxy.a.indexOf(proxy.a[0]), 0);
	t.is(proxy.a.indexOf(proxy.a[1]), 1);
	t.is(proxy.a.indexOf(proxy.a[2]), 2);

	// Store references to original proxy objects
	const originalFirst = proxy.a[0];
	const originalSecond = proxy.a[1];
	const originalThird = proxy.a[2];

	// Filter and reassign (filter returns everything)
	proxy.a = proxy.a.filter(() => true);

	// Post-filter check - this should work with the fix
	t.is(proxy.a.indexOf(proxy.a[0]), 0);
	t.is(proxy.a.indexOf(proxy.a[1]), 1);
	t.is(proxy.a.indexOf(proxy.a[2]), 2);

	// With the fix, old proxies should still be findable after filter
	t.is(proxy.a.indexOf(originalFirst), 0);
	t.is(proxy.a.indexOf(originalSecond), 1);
	t.is(proxy.a.indexOf(originalThird), 2);

	// Test other search methods as well
	t.is(proxy.a.lastIndexOf(originalFirst), 0);
	t.is(proxy.a.lastIndexOf(originalSecond), 1);
	t.is(proxy.a.lastIndexOf(originalThird), 2);

	t.true(proxy.a.includes(originalFirst));
	t.true(proxy.a.includes(originalSecond));
	t.true(proxy.a.includes(originalThird));
});

test('array search methods should handle edge cases safely - issue #102', t => {
	const object = {
		array: [1, 2, 3],
		nested: {
			array: [4, 5, 6],
		},
	};
	const proxy = onChange(object, () => {});

	// Test 1: Normal operation
	t.is(proxy.array.indexOf(2), 1);
	t.is(proxy.array.lastIndexOf(2), 1);
	t.true(proxy.array.includes(2));

	// Test 2: After parent deletion (orphaned proxy)
	const orphanedArray = proxy.nested.array;
	delete proxy.nested;

	// Should still work on the orphaned proxy
	t.is(orphanedArray.indexOf(5), 1);
	t.is(orphanedArray.lastIndexOf(5), 1);
	t.true(orphanedArray.includes(5));

	// Test 3: Empty array
	proxy.array = [];
	t.is(proxy.array.indexOf(1), -1);
	t.is(proxy.array.lastIndexOf(1), -1);
	t.false(proxy.array.includes(1));

	// Test 4: Undefined and null elements
	proxy.array = [undefined, null, 1];
	t.is(proxy.array.indexOf(undefined), 0);
	t.is(proxy.array.indexOf(null), 1);
	t.is(proxy.array.lastIndexOf(undefined), 0);
	t.true(proxy.array.includes(undefined));
	t.true(proxy.array.includes(null));

	// Test 5: With negative indices
	proxy.array = [1, 2, 3, 1];
	t.is(proxy.array.indexOf(1, -2), 3);
	t.is(proxy.array.lastIndexOf(1, -2), 0);
	t.true(proxy.array.includes(1, -1));
});

for (const typedArray of typedArrays) {
	test('should return the length of a ' + typedArray.constructor.name, t => {
		testRunner(t, typedArray, {}, (proxy, verify) => {
			verify(0);

			t.is(proxy.length, 3);

			verify(0);
		});
	});
}
