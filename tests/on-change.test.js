import test from 'ava';
import onChange from '../index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';

setOnChange(onChange);

test('main', t => {
	const object = {
		foo: false,
		bar: {
			a: {
				b: 0,
				c: [1, 2],
			},
		},
	};

	let callCount = 0;

	const proxy = onChange(object, () => {
		callCount++;
	});

	proxy.foo = true;
	t.is(proxy.constructor, Object);
	t.is(callCount, 1);

	Object.defineProperty(proxy, 'newProp', {
		value: '🦄',
	});
	t.is(callCount, 2);

	Object.assign(proxy, {foo: false});
	t.is(callCount, 3);

	delete proxy.foo;
	t.is(proxy.foo, undefined);
	t.is(callCount, 4);

	// Unwrap proxies on assignment
	const previous = object.bar.a;
	proxy.bar.a = proxy.bar.a; // eslint-disable-line no-self-assign
	t.is(object.bar.a, previous);
});

test('should trigger after after the change is done', t => {
	const proxy = onChange({x: 0}, () => {
		t.is(proxy.x, 1);
	});

	proxy.x = 1;
});

test('should provide the original proxied object, the path to the changed value, the previous value at path, and the new value at path', t => {
	const object = {
		x: {
			y: [
				{
					z: 0,
				},
			],
		},
	};

	testRunner(t, object, {}, (proxy, verify, reset, last) => {
		proxy.x.y[0].z = 1;
		verify(1, proxy, 'x.y.0.z', 1, 0);

		proxy.x.y[0].new = 1;
		verify(2, proxy, 'x.y.0.new', 1, undefined);

		delete proxy.x.y[0].new;
		verify(3, proxy, 'x.y.0.new', undefined, 1);

		proxy.x.y.push('pushed');
		verify(4, proxy, 'x.y', [{z: 1}, 'pushed'], [{z: 1}], {
			name: 'push',
			args: ['pushed'],
			result: 2,
		});

		proxy.x.y.pop();
		verify(5, proxy, 'x.y', [{z: 1}], [{z: 1}, 'pushed'], {
			name: 'pop',
			args: [],
			result: 'pushed',
		});

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, 'x.y', ['unshifted', {z: 1}], [{z: 1}], {
			name: 'unshift',
			args: ['unshifted'],
			result: 2,
		});

		proxy.x.y.shift();
		verify(7, proxy, 'x.y', [{z: 1}], ['unshifted', {z: 1}], {
			name: 'shift',
			args: [],
			result: 'unshifted',
		});

		proxy.x.y = [...proxy.x.y, {z: 3}, {z: 2}];
		verify(8, proxy, 'x.y', [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		const sorter = (a, b) => a.z - b.z;
		proxy.x.y.sort(sorter);
		verify(9, proxy, 'x.y', [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}], {
			name: 'sort',
			args: [sorter],
			result: [{z: 1}, {z: 2}, {z: 3}],
		});

		proxy.x.y.reverse();
		verify(10, proxy, 'x.y', [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}], {
			name: 'reverse',
			args: [],
			result: [{z: 3}, {z: 2}, {z: 1}],
		});

		const forEachCallback = item => item.z++;
		proxy.x.y.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(11, proxy, 'x.y', [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});

		proxy.x.y.splice(1, 2);
		verify(12, proxy, 'x.y', [{z: 4}], [{z: 4}, {z: 3}, {z: 2}], {
			name: 'splice',
			args: [1, 2],
			result: [{z: 3}, {z: 2}],
		});

		let unproxied = onChange.target(proxy);

		t.is(unproxied, object);
		t.not(unproxied, proxy);
		t.deepEqual(unproxied, proxy);

		unproxied = onChange.target(unproxied);

		t.is(unproxied, object);
		t.not(unproxied, proxy);
		t.deepEqual(unproxied, proxy);

		proxy.foo = function () {
			proxy.x.y[0].z = 2;
		};

		t.is(last.count, 13);

		proxy.foo();
		t.is(last.thisArg, proxy);
		t.is(last.path, '');
		t.is(last.count, 14);
	});
});

test('should provide the original proxied object, the path to the changed value, the previous value at path, and the new value at path when pathAsArray is true', t => {
	const object = {
		x: {
			y: [
				{
					z: 0,
				},
			],
		},
	};

	testRunner(t, object, {pathAsArray: true}, (proxy, verify, reset, last) => {
		proxy.x.y[0].z = 1;
		verify(1, proxy, ['x', 'y', '0', 'z'], 1, 0);

		proxy.x.y[0].new = 1;
		verify(2, proxy, ['x', 'y', '0', 'new'], 1, undefined);

		delete proxy.x.y[0].new;
		verify(3, proxy, ['x', 'y', '0', 'new'], undefined, 1);

		proxy.x.y.push('pushed');
		verify(4, proxy, ['x', 'y'], [{z: 1}, 'pushed'], [{z: 1}], {
			name: 'push',
			args: ['pushed'],
			result: 2,
		});

		proxy.x.y.pop();
		verify(5, proxy, ['x', 'y'], [{z: 1}], [{z: 1}, 'pushed'], {
			name: 'pop',
			args: [],
			result: 'pushed',
		});

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, ['x', 'y'], ['unshifted', {z: 1}], [{z: 1}], {
			name: 'unshift',
			args: ['unshifted'],
			result: 2,
		});

		proxy.x.y.shift();
		verify(7, proxy, ['x', 'y'], [{z: 1}], ['unshifted', {z: 1}], {
			name: 'shift',
			args: [],
			result: 'unshifted',
		});

		proxy.x.y = [...proxy.x.y, {z: 3}, {z: 2}];
		verify(8, proxy, ['x', 'y'], [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		const sorter = (a, b) => a.z - b.z;
		proxy.x.y.sort(sorter);
		verify(9, proxy, ['x', 'y'], [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}], {
			name: 'sort',
			args: [sorter],
			result: [{z: 1}, {z: 2}, {z: 3}],
		});

		proxy.x.y.reverse();
		verify(10, proxy, ['x', 'y'], [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}], {
			name: 'reverse',
			args: [],
			result: [{z: 3}, {z: 2}, {z: 1}],
		});

		const forEachCallback = item => item.z++;
		proxy.x.y.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(11, proxy, ['x', 'y'], [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});

		proxy.x.y.splice(1, 2);
		verify(12, proxy, ['x', 'y'], [{z: 4}], [{z: 4}, {z: 3}, {z: 2}], {
			name: 'splice',
			args: [1, 2],
			result: [{z: 3}, {z: 2}],
		});

		let unproxied = onChange.target(proxy);

		t.is(unproxied, object);
		t.not(unproxied, proxy);
		t.deepEqual(unproxied, proxy);

		unproxied = onChange.target(unproxied);

		t.is(unproxied, object);
		t.not(unproxied, proxy);
		t.deepEqual(unproxied, proxy);

		proxy.foo = function () {
			proxy.x.y[0].z = 2;
		};

		t.is(last.count, 13);

		proxy.foo();
		t.is(last.thisArg, proxy);
		t.deepEqual(last.path, []);
		t.is(last.count, 14);
	});
});

test('should not trigger when methods are called that don’t mutate the proxied item', t => {
	const object = [
		{
			y: 1,
		},
		{
			y: 2,
		},
		{
			y: 3,
		},
	];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.map(item => item.y);
		verify(0);

		proxy.reduce((result, item) => { // eslint-disable-line unicorn/no-array-reduce
			result.push(item.y);
			return result;
		}, []);
		verify(0);

		proxy.slice(0, 1);
		verify(0);
	});
});

test('should return a raw value when apply traps are triggered', t => {
	const object = {
		x: {
			y: [{
				z: 0,
			}],
		},
	};

	testRunner(t, object, {}, (proxy, verify, reset, last) => {
		proxy.x.y.push('pushed');
		verify(1, proxy, 'x.y', [{z: 0}, 'pushed'], [{z: 0}], {
			name: 'push',
			args: ['pushed'],
			result: 2,
		});

		last.value.pop();
		t.is(last.count, 1);
	});
});

test('should return a raw value when apply traps are triggered and pathAsArray is true', t => {
	const object = {
		x: {
			y: [{
				z: 0,
			}],
		},
	};

	testRunner(t, object, {pathAsArray: true}, (proxy, verify, reset, last) => {
		proxy.x.y.push('pushed');
		verify(1, proxy, ['x', 'y'], [{z: 0}, 'pushed'], [{z: 0}], {
			name: 'push',
			args: ['pushed'],
			result: 2,
		});

		last.value.pop();
		t.is(last.count, 1);
	});
});

test('should not call the callback for nested items of an object if isShallow is true', t => {
	const object = {
		x: {
			y: [{
				z: 0,
			}],
		},
	};

	testRunner(t, object, {isShallow: true}, (proxy, verify) => {
		proxy.a = 1;
		verify(1, proxy, 'a', 1, undefined);

		proxy.x.new = 1;
		verify(1, proxy, 'a', 1, undefined);

		proxy.x.y[0].new = 1;
		verify(1, proxy, 'a', 1, undefined);

		proxy.a = 2;
		verify(2, proxy, 'a', 2, 1);
	});
});

test('should allow nested proxied objects', t => {
	const object1 = {
		x: {
			y: [
				{
					z: 0,
				},
			],
		},
	};
	const object2 = {
		a: {
			b: [
				{
					c: 0,
				},
			],
		},
	};

	let callCount1 = 0;
	let returnedObject1;
	let returnedPath1;
	let returnedPrevious1;
	let returnedValue1;

	let callCount2 = 0;
	let returnedObject2;
	let returnedPath2;
	let returnedPrevious2;
	let returnedValue2;

	const proxy1 = onChange(object1, function (path, value, previous) {
		returnedObject1 = this; // eslint-disable-line unicorn/no-this-assignment
		returnedPath1 = path;
		returnedValue1 = value;
		returnedPrevious1 = previous;
		callCount1++;
	});
	const proxy2 = onChange(object2, function (path, value, previous) {
		returnedObject2 = this; // eslint-disable-line unicorn/no-this-assignment
		returnedPath2 = path;
		returnedValue2 = value;
		returnedPrevious2 = previous;
		callCount2++;
	});

	proxy1.x.y[0].z = 1;
	t.is(returnedObject1, proxy1);
	t.is(returnedPath1, 'x.y.0.z');
	t.is(returnedPrevious1, 0);
	t.is(returnedValue1, 1);
	t.is(callCount1, 1);
	t.is(callCount2, 0);

	proxy2.a.b[0].c = 1;
	t.is(returnedObject2, proxy2);
	t.is(returnedPath2, 'a.b.0.c');
	t.is(returnedPrevious2, 0);
	t.is(returnedValue2, 1);
	t.is(callCount1, 1);
	t.is(callCount2, 1);

	proxy1.g = proxy2;
	t.is(returnedObject1, proxy1);
	t.is(returnedPath1, 'g');
	t.is(returnedPrevious1, undefined);
	t.is(returnedValue1, proxy2);
	t.is(callCount1, 2);
	t.is(callCount2, 1);

	proxy1.g.a.b[0].c = 2;
	t.is(returnedObject1, proxy1);
	t.is(returnedPath1, 'g.a.b.0.c');
	t.is(returnedPrevious1, 1);
	t.is(returnedValue1, 2);
	t.is(callCount1, 3);

	t.is(returnedObject2, proxy2);
	t.is(returnedPath2, 'a.b.0.c');
	t.is(returnedPrevious2, 1);
	t.is(returnedValue2, 2);
	t.is(callCount2, 2);
});

test('should allow nested proxied objects when pathAsArray is true', t => {
	const object1 = {
		x: {
			y: [
				{
					z: 0,
				},
			],
		},
	};
	const object2 = {
		a: {
			b: [
				{
					c: 0,
				},
			],
		},
	};

	let callCount1 = 0;
	let returnedObject1;
	let returnedPath1;
	let returnedPrevious1;
	let returnedValue1;

	let callCount2 = 0;
	let returnedObject2;
	let returnedPath2;
	let returnedPrevious2;
	let returnedValue2;

	const proxy1 = onChange(object1, function (path, value, previous) {
		returnedObject1 = this; // eslint-disable-line unicorn/no-this-assignment
		returnedPath1 = path;
		returnedValue1 = value;
		returnedPrevious1 = previous;
		callCount1++;
	}, {pathAsArray: true});
	const proxy2 = onChange(object2, function (path, value, previous) {
		returnedObject2 = this; // eslint-disable-line unicorn/no-this-assignment
		returnedPath2 = path;
		returnedValue2 = value;
		returnedPrevious2 = previous;
		callCount2++;
	}, {pathAsArray: true});

	proxy1.x.y[0].z = 1;
	t.is(returnedObject1, proxy1);
	t.deepEqual(returnedPath1, ['x', 'y', '0', 'z']);
	t.is(returnedPrevious1, 0);
	t.is(returnedValue1, 1);
	t.is(callCount1, 1);
	t.is(callCount2, 0);

	proxy2.a.b[0].c = 1;
	t.is(returnedObject2, proxy2);
	t.deepEqual(returnedPath2, ['a', 'b', '0', 'c']);
	t.is(returnedPrevious2, 0);
	t.is(returnedValue2, 1);
	t.is(callCount1, 1);
	t.is(callCount2, 1);

	proxy1.g = proxy2;
	t.is(returnedObject1, proxy1);
	t.deepEqual(returnedPath1, ['g']);
	t.is(returnedPrevious1, undefined);
	t.is(returnedValue1, proxy2);
	t.is(callCount1, 2);
	t.is(callCount2, 1);

	proxy1.g.a.b[0].c = 2;
	t.is(returnedObject1, proxy1);
	t.deepEqual(returnedPath1, ['g', 'a', 'b', '0', 'c']);
	t.is(returnedPrevious1, 1);
	t.is(returnedValue1, 2);
	t.is(callCount1, 3);

	t.is(returnedObject2, proxy2);
	t.deepEqual(returnedPath2, ['a', 'b', '0', 'c']);
	t.is(returnedPrevious2, 1);
	t.is(returnedValue2, 2);
	t.is(callCount2, 2);
});

test('should be able to mutate itself in an object', t => {
	const method = proxy => {
		proxy.x++;
	};

	const object = {
		x: 0,
		method,
	};

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.method(proxy);
		verify(1, proxy, '', {x: 1, method}, {x: 0, method}, {
			name: 'method',
			args: [proxy],
			result: undefined,
		});
	});
});

test('should be able to mutate itself in a class', t => {
	class TestClass {
		constructor(x) {
			this.x = x || 0;
		}

		method() {
			this.x++;
		}
	}

	testRunner(t, new TestClass(), {}, (proxy, verify) => {
		proxy.method();
		verify(1, proxy, '', new TestClass(1), {x: 0}, {
			name: 'method',
			args: [],
			result: undefined,
		});
	});
});

test('should not trigger after unsubscribe is called', t => {
	const object = {
		x: {
			y: [{
				z: 0,
			}],
		},
	};

	testRunner(t, object, {}, (proxy, verify, reset) => {
		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);

		const {forEach} = proxy.x.y;
		let unsubscribed = onChange.unsubscribe(proxy);
		reset();

		proxy.z = false;
		verify(0);

		unsubscribed.x.y[0].z = true;
		verify(0);

		unsubscribed = onChange.unsubscribe(unsubscribed);

		unsubscribed.x.y[0].z = true;
		verify(0);

		forEach.call(proxy.x.y, item => {
			item.z++;
		});
		verify(0);
	});
});

test('should trigger if a new property is set to undefined', t => {
	const object = {
		x: true,
	};

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.z = undefined;
		verify(1, proxy, 'z', undefined, undefined);
	});
});

test('should NOT trigger if defining a property fails', t => {
	const object = {
		x: true,
	};

	Object.freeze(object);

	testRunner(t, object, {}, (proxy, verify) => {
		t.throws(() => {
			Object.defineProperty(proxy, 'y', {
				configurable: false,
				writable: false,
				value: false,
			});
		});

		verify(0, undefined, undefined, undefined, undefined);
	});
});

test('should NOT trigger if defining a property that is already set', t => {
	const object = {};

	Object.defineProperty(object, 'x', {
		configurable: true,
		enumerable: true,
		writable: true,
		value: 1,
	});

	Object.defineProperty(object, 'y', {
		configurable: true,
		value: 2,
	});

	testRunner(t, object, {}, (proxy, verify) => {
		t.not(proxy.x, 3);
		t.not(proxy.y, 3);

		Object.defineProperty(proxy, 'x', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: 1,
		});
		verify(0);

		Object.defineProperty(proxy, 'y', {
			configurable: true,
			enumerable: false,
			writable: false,
			value: 2,
		});
		verify(0);
	});
});

test('should NOT trigger if setting a property fails', t => {
	const object = {
		x: true,
	};

	Object.freeze(object);

	testRunner(t, object, {}, (proxy, verify) => {
		t.throws(() => {
			proxy.x = false;
		});

		verify(0);
	});
});

test('should NOT trigger if deleting a property fails', t => {
	const object = {
		x: true,
	};

	Object.freeze(object);

	testRunner(t, object, {}, (proxy, verify) => {
		t.throws(() => {
			delete proxy.x;
		});

		verify(0);
	});
});

test('should handle changes in nested apply traps', t => {
	const object = [{a: [{x: 1}]}];

	testRunner(t, object, {}, (proxy, verify) => {
		let forEachCallback = item => {
			item.a = item.a.map(subItem => ({x: subItem.x + 1}));
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each

		verify(1, proxy, '', object, [{a: [{x: 1}]}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});

		forEachCallback = item => {
			for (const subItem of item.a) {
				subItem.x++;
			}
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each

		verify(2, proxy, '', object, [{a: [{x: 2}]}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});
	});
});

test('should not wrap a proxied object in another proxy', t => {
	const object = {
		b: {a: 1},
		get c() {
			return this.b;
		},
	};

	const proxy = onChange(object, () => {});

	t.is(proxy.b, proxy.c);
});

test('path should be the shorter one in the same object for circular references', t => {
	const layer1 = {value: 0};
	const layer2 = {value: 0};
	const layer3 = {value: 0};

	const group = {
		layers: [layer1, layer2, layer3],
		value: 0,
	};

	layer1.group = group;
	layer2.group = group;
	layer3.group = group;

	let resultPath;

	const proxy = onChange(group, path => {
		resultPath = path;
	});

	proxy.layers[0].value = 11;
	t.is(resultPath, 'layers.0.value');

	proxy.layers[0].group.value = 22;
	t.is(resultPath, 'layers.0.group.value');

	proxy.layers[0].group.layers[0].value = 33;
	t.is(resultPath, 'layers.0.value');

	proxy.layers[1].group.layers[0].group.layers[1].group.layers[1].group.layers[2].value = 33;
	t.is(resultPath, 'layers.2.value');
});

test('array path should be the shorter one in the same object for circular references', t => {
	const layer1 = {value: 0};
	const layer2 = {value: 0};
	const layer3 = {value: 0};

	const group = {
		layers: [layer1, layer2, layer3],
		value: 0,
	};

	layer1.group = group;
	layer2.group = group;
	layer3.group = group;

	let resultPath;

	const proxy = onChange(group, path => {
		resultPath = path;
	}, {
		pathAsArray: true,
	});

	proxy.layers[0].value = 11;
	t.is(resultPath[0], 'layers');
	t.is(resultPath[1], '0');
	t.is(resultPath[2], 'value');

	proxy.layers[0].group.value = 22;
	t.is(resultPath[0], 'layers');
	t.is(resultPath[1], '0');
	t.is(resultPath[2], 'group');
	t.is(resultPath[3], 'value');

	proxy.layers[0].group.layers[0].value = 33;
	t.is(resultPath[0], 'layers');
	t.is(resultPath[1], '0');
	t.is(resultPath[2], 'value');

	proxy.layers[1].group.layers[0].group.layers[1].group.layers[1].group.layers[2].value = 33;
	t.is(resultPath[0], 'layers');
	t.is(resultPath[1], '2');
	t.is(resultPath[2], 'value');
});

test('should trigger when methods are called that mutate unrelated area of proxy when pathAsArray is false', t => {
	const object = {
		a: [
			{
				quantity: 1
			}
		],
		b: {
			c: {
				quantity: 8,
			},
		}
	};

	testRunner(t, object, {pathAsArray: false}, (proxy, verify) => {
		proxy.a.forEach(() => {
			proxy.b.c = {
				quantity: 3,
			};
		});

		verify(1, proxy, 'b.c', { quantity: 3 }, { quantity: 8 });
	});
});

test('should trigger when methods are called that mutate unrelated area of proxy when pathAsArray is true', t => {
	const object = {
		a: [
			{
				quantity: 1
			}
		],
		b: {
			c: {
				quantity: 8,
			},
		}
	};

	testRunner(t, object, {pathAsArray: true}, (proxy, verify) => {
		proxy.a.forEach(() => {
			proxy.b.c = {
				quantity: 3,
			};
		});

		verify(1, proxy, ['b', 'c'], { quantity: 3 }, { quantity: 8 });
	});
});
