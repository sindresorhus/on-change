const onChange = require('..');
const displayValue = require('display-value');
const test = require('ava');
const {dates, testValues} = require('./helpers/data-types');

const testHelper = (t, object, options, callback) => {
	const last = {};

	const reset = () => {
		last.count = 0;
		last.thisArg = undefined;
		last.path = undefined;
		last.value = undefined;
		last.previous = undefined;
	};

	reset();

	const proxy = onChange(object, function (path, value, previous, name) {
		last.count++;
		last.thisArg = this;
		last.path = path;
		last.value = value;
		last.previous = previous;
		last.name = name;
	}, options);

	// eslint-disable-next-line max-params
	const verify = (count, thisArg, path, value, previous, name, fullObject) => {
		t.is(count, last.count);
		t.is(thisArg, last.thisArg);
		t.deepEqual(path, last.path);
		t.deepEqual(value, last.value);
		t.deepEqual(previous, last.previous);
		t.is(name, last.name);

		t.is(object, onChange.target(proxy));

		if (fullObject !== undefined) {
			t.deepEqual(fullObject, object);
			t.deepEqual(proxy, object);
		}
	};

	callback(proxy, verify, reset, last);

	onChange.unsubscribe(proxy);
};

test('main', t => {
	const object = {
		foo: false,
		bar: {
			a: {
				b: 0,
				c: [1, 2]
			}
		}
	};

	let callCount = 0;

	const proxy = onChange(object, () => {
		callCount++;
	});

	proxy.foo = true;
	t.is(proxy.constructor, Object);
	t.is(callCount, 1);

	Object.defineProperty(proxy, 'newProp', {
		value: '🦄'
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

const compare = (t, a, b) => {
	if (a) {
		a = onChange.target(a);
	}

	t.is(a, b);
};

for (const [index1, value1] of testValues.entries()) {
	for (const [index2, value2] of testValues.entries()) {
		const tag = `(${index1}/${index2})`;

		if (index1 === index2) {
			test(`should NOT detect value changes when reset to ${displayValue(value1)} ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1]
				};

				testHelper(t, object, {}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(0);

					proxy.a = value2;
					verify(0);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(0);

					proxy.b[2] = value2;
					verify(0);
				});
			});
		} else {
			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)} ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1]
				};

				testHelper(t, object, {}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(1, proxy, 'a', value2, value1);

					proxy.a = value2;
					verify(1, proxy, 'a', value2, value1);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(2, proxy, 'b.2', value2, value1);

					proxy.b[2] = value2;
					verify(2, proxy, 'b.2', value2, value1);

					delete proxy.nonExistent;
					verify(2, proxy, 'b.2', value2, value1);

					delete proxy.b;
					t.is(proxy.b, undefined);
					verify(3, proxy, 'b', undefined, [1, 2, value2]);
				});
			});

			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)} when pathAsArray is true ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1]
				};

				testHelper(t, object, {pathAsArray: true}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(1, proxy, ['a'], value2, value1);

					proxy.a = value2;
					verify(1, proxy, ['a'], value2, value1);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(2, proxy, ['b', '2'], value2, value1);

					proxy.b[2] = value2;
					verify(2, proxy, ['b', '2'], value2, value1);

					delete proxy.nonExistent;
					verify(2, proxy, ['b', '2'], value2, value1);

					delete proxy.b;
					t.is(proxy.b, undefined);
					verify(3, proxy, ['b'], undefined, [1, 2, value2]);
				});
			});
		}
	}
}

test('dates', t => {
	const object = {
		a: 0
	};
	const date = dates[0];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = date;
		t.true(proxy.a instanceof Date);
		verify(1, proxy, 'a', date, 0);

		let clone = new Date(date);
		proxy.a.setSeconds(32);
		verify(2, proxy, 'a', date, clone, 'setSeconds');

		clone = new Date(date);
		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, 'setHours');

		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, 'setHours');
	});
});

test('should trigger once when an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy[0] = 'a';
		verify(1, proxy, '0', 'a', 1, undefined, ['a', 2, {a: false}]);
	});
});

test('should trigger once when a property of an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy[2].a = true;
		verify(1, proxy, '2.a', true, false, undefined, [1, 2, {a: true}]);
	});
});

test('should trigger once when an array is sorted with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.sort();
		verify(1, proxy, '', [1, 2, 3], [2, 3, 1], 'sort', [1, 2, 3]);
	});
});

test('should trigger once when an array is popped with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.pop();
		verify(1, proxy, '', [2, 3], [2, 3, 1], 'pop', [2, 3]);
	});
});

test('should trigger once when an array is reversed with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.reverse();
		verify(1, proxy, '', [1, 3, 2], [2, 3, 1], 'reverse', [1, 3, 2]);
	});
});

test('should trigger once when an array is spliced with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.splice(1, 1, 'a', 'b');
		verify(1, proxy, '', [2, 'a', 'b', 1], [2, 3, 1], 'splice', [2, 'a', 'b', 1]);
	});
});

test('invariants', t => {
	const object = {};

	Object.defineProperty(object, 'nonWritable', {
		configurable: false,
		writable: false,
		value: {a: true}
	});
	// eslint-disable-next-line accessor-pairs
	Object.defineProperty(object, 'nonReadable', {
		configurable: false,
		set: () => {} // No-Op setter
	});
	Object.defineProperty(object, 'useAccessor', {
		configurable: false,
		set(value) {
			this._useAccessor = value;
		},
		get() {
			return this._useAccessor;
		}
	});

	let callCount = 0;

	const proxy = onChange(object, () => {
		callCount++;
	});

	t.is(proxy.nonWritable, object.nonWritable);
	t.is(proxy.nonWritable, object.nonWritable);
	t.is(proxy.nonReadable, undefined);
	t.is(proxy.nonReadable, undefined);

	proxy.useAccessor = 10;
	t.is(proxy.useAccessor, 10);
	t.is(callCount, 2);

	proxy.useAccessor = 20;
	t.is(proxy.useAccessor, 20);
	t.is(callCount, 4);
});

test('should invalidate cached descriptors when a property is defined', t => {
	const object = {};
	const value1 = {b: 1};
	const value2 = {c: 2};

	let callCount = 0;

	const proxy = onChange(object, () => {
		callCount++;
	});

	Object.defineProperty(proxy, 'a', {
		configurable: true,
		writable: true,
		value: value1
	});

	t.is(callCount, 1);
	t.deepEqual(proxy.a, value1);

	Object.defineProperty(proxy, 'a', {
		configurable: true,
		writable: true,
		value: value1
	});

	t.is(callCount, 1);
	t.deepEqual(proxy.a, value1);

	Object.defineProperty(proxy, 'a', {
		configurable: false,
		writable: true,
		value: value2
	});

	t.is(callCount, 2);

	t.deepEqual(proxy.a, value2);

	Object.defineProperty(proxy, 'a', {
		configurable: false,
		writable: true,
		value: value2
	});

	t.is(callCount, 2);

	t.deepEqual(proxy.a, value2);
});

test('should detect a change from within a setter', t => {
	const object = {
		_x: 0,
		get x() {
			return this._x;
		},
		set x(value) {
			this._x = value;
		}
	};

	testHelper(t, object, {}, (proxy, verify) => {
		verify(0);

		proxy.x = 1;
		verify(2, proxy, 'x', 1, 0);
	});
});

test('should detect a change from within a setter when ignoreUnderscores is true', t => {
	const object = {
		_x: 0,
		get x() {
			return this._x;
		},
		set x(value) {
			this._x = value;
		}
	};

	testHelper(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
		verify(0);

		proxy.x = 1;
		verify(1, proxy, 'x', 1, 0);
	});
});

test('should detect a change from within a nested setter', t => {
	const object = {
		z: {
			_x: 0,
			get x() {
				return this._x;
			},
			set x(value) {
				this._x = value;
			}
		}
	};

	testHelper(t, object, {}, (proxy, verify) => {
		verify(0);

		proxy.z.x = 1;
		verify(2, proxy, 'z.x', 1, 0);
	});
});

test('should detect a change from within a nested setter when ignoreUnderscores is true', t => {
	const object = {
		z: {
			_x: 0,
			get x() {
				return this._x;
			},
			set x(value) {
				this._x = value;
			}
		}
	};

	testHelper(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
		verify(0);

		proxy.z.x = 1;
		verify(1, proxy, 'z.x', 1, 0);
	});
});

test('the change handler is called after the change is done', t => {
	const proxy = onChange({x: 0}, () => {
		t.is(proxy.x, 1);
	});

	proxy.x = 1;
});

test('the callback should provide the original proxied object, the path to the changed value, the previous value at path, and the new value at path', t => {
	const object = {
		x: {
			y: [
				{
					z: 0
				}
			]
		}
	};

	testHelper(t, object, {}, (proxy, verify, reset, last) => {
		proxy.x.y[0].z = 1;
		verify(1, proxy, 'x.y.0.z', 1, 0);

		proxy.x.y[0].new = 1;
		verify(2, proxy, 'x.y.0.new', 1, undefined);

		delete proxy.x.y[0].new;
		verify(3, proxy, 'x.y.0.new', undefined, 1);

		proxy.x.y.push('pushed');
		verify(4, proxy, 'x.y', [{z: 1}, 'pushed'], [{z: 1}], 'push');

		proxy.x.y.pop();
		verify(5, proxy, 'x.y', [{z: 1}], [{z: 1}, 'pushed'], 'pop');

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, 'x.y', ['unshifted', {z: 1}], [{z: 1}], 'unshift');

		proxy.x.y.shift();
		verify(7, proxy, 'x.y', [{z: 1}], ['unshifted', {z: 1}], 'shift');

		proxy.x.y = proxy.x.y.concat([{z: 3}, {z: 2}]);
		verify(8, proxy, 'x.y', [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		proxy.x.y.sort((a, b) => a.z - b.z);
		verify(9, proxy, 'x.y', [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}], 'sort');

		proxy.x.y.reverse();
		verify(10, proxy, 'x.y', [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}], 'reverse');

		proxy.x.y.forEach(item => item.z++);
		verify(11, proxy, 'x.y', [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}], 'forEach');

		proxy.x.y.splice(1, 2);
		verify(12, proxy, 'x.y', [{z: 4}], [{z: 4}, {z: 3}, {z: 2}], 'splice');

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

test('the callback should provide the original proxied object, the path to the changed value, the previous value at path, and the new value at path when pathAsArray is true', t => {
	const object = {
		x: {
			y: [
				{
					z: 0
				}
			]
		}
	};

	testHelper(t, object, {pathAsArray: true}, (proxy, verify, reset, last) => {
		proxy.x.y[0].z = 1;
		verify(1, proxy, ['x', 'y', '0', 'z'], 1, 0);

		proxy.x.y[0].new = 1;
		verify(2, proxy, ['x', 'y', '0', 'new'], 1, undefined);

		delete proxy.x.y[0].new;
		verify(3, proxy, ['x', 'y', '0', 'new'], undefined, 1);

		proxy.x.y.push('pushed');
		verify(4, proxy, ['x', 'y'], [{z: 1}, 'pushed'], [{z: 1}], 'push');

		proxy.x.y.pop();
		verify(5, proxy, ['x', 'y'], [{z: 1}], [{z: 1}, 'pushed'], 'pop');

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, ['x', 'y'], ['unshifted', {z: 1}], [{z: 1}], 'unshift');

		proxy.x.y.shift();
		verify(7, proxy, ['x', 'y'], [{z: 1}], ['unshifted', {z: 1}], 'shift');

		proxy.x.y = proxy.x.y.concat([{z: 3}, {z: 2}]);
		verify(8, proxy, ['x', 'y'], [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		proxy.x.y.sort((a, b) => a.z - b.z);
		verify(9, proxy, ['x', 'y'], [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}], 'sort');

		proxy.x.y.reverse();
		verify(10, proxy, ['x', 'y'], [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}], 'reverse');

		proxy.x.y.forEach(item => item.z++);
		verify(11, proxy, ['x', 'y'], [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}], 'forEach');

		proxy.x.y.splice(1, 2);
		verify(12, proxy, ['x', 'y'], [{z: 4}], [{z: 4}, {z: 3}, {z: 2}], 'splice');

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

test('the callback should not get called when methods are called that don’t mutate the proxied item', t => {
	const object = [
		{
			y: 1
		},
		{
			y: 2
		},
		{
			y: 3
		}
	];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.map(item => item.y);
		verify(0);

		proxy.reduce((result, item) => { // eslint-disable-line unicorn/no-reduce
			result.push(item.y);
			return result;
		}, []);
		verify(0);

		proxy.slice(0, 1);
		verify(0);
	});
});

test('the callback should return a raw value when apply traps are triggered', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {}, (proxy, verify, reset, last) => {
		proxy.x.y.push('pushed');
		verify(1, proxy, 'x.y', [{z: 0}, 'pushed'], [{z: 0}], 'push');

		last.value.pop();
		t.is(last.count, 1);
	});
});

test('the callback should return a raw value when apply traps are triggered and pathAsArray is true', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {pathAsArray: true}, (proxy, verify, reset, last) => {
		proxy.x.y.push('pushed');
		verify(1, proxy, ['x', 'y'], [{z: 0}, 'pushed'], [{z: 0}], 'push');

		last.value.pop();
		t.is(last.count, 1);
	});
});

test('should trigger the callback when a Symbol is used as the key and ignoreSymbols is not set', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');

		proxy[SYMBOL] = true;
		verify(1, proxy, 'Symbol(test)', true, undefined);

		Object.defineProperty(proxy, SYMBOL2, {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false
		});
		verify(2, proxy, 'Symbol(test2)', true, undefined);

		delete proxy[SYMBOL2];
		verify(3, proxy, 'Symbol(test2)', undefined, true);

		proxy.z = true;
		verify(4, proxy, 'z', true, undefined);
	});
});

test('the callback should trigger when a Symbol is used as the key and ignoreSymbols is not set and pathAsArray is true', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {pathAsArray: true}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');

		proxy[SYMBOL] = true;
		verify(1, proxy, [SYMBOL], true, undefined);

		Object.defineProperty(proxy, SYMBOL2, {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false
		});
		verify(2, proxy, [SYMBOL2], true, undefined);

		delete proxy[SYMBOL2];
		verify(3, proxy, [SYMBOL2], undefined, true);

		proxy.z = true;
		verify(4, proxy, ['z'], true, undefined);
	});
});

test('should not trigger the callback when a Symbol is used as the key and ignoreSymbols is true', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {ignoreSymbols: true}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');
		const object2 = {
			c: 2
		};

		proxy[SYMBOL] = object2;
		verify(0);

		t.is(proxy[SYMBOL], object2);

		proxy[SYMBOL].c = 3;
		verify(0);

		Object.defineProperty(proxy, SYMBOL2, {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false
		});
		verify(0);

		delete proxy[SYMBOL2];
		verify(0);

		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);
	});
});

test('should not trigger the callback when a key is used that is in ignoreKeys', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {ignoreKeys: ['a', 'b']}, (proxy, verify) => {
		const object2 = {
			c: 2
		};

		proxy.a = object2;
		verify(0);

		t.is(proxy.a, object2);

		proxy.a.c = 3;
		verify(0);

		Object.defineProperty(proxy, 'b', {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false
		});
		verify(0);

		delete proxy.b;
		verify(0);

		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);
	});
});

test('should not trigger the callback when a key with an underscore is used and ignoreUnderscores is true', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
		const object2 = {
			c: 2
		};

		proxy._a = object2;
		verify(0);

		t.is(proxy._a, object2);

		proxy._a.c = 3;
		verify(0);

		Object.defineProperty(proxy, '_b', {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false
		});
		verify(0);

		delete proxy._b;
		verify(0);

		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);
	});
});

test('should not call the callback for nested items of an object if isShallow is true', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {isShallow: true}, (proxy, verify) => {
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

test('should not call the callback for nested items of an array if isShallow is true', t => {
	const array = [{z: 0}];

	testHelper(t, array, {isShallow: true}, (proxy, verify) => {
		proxy[0].z = 1;
		verify(0);

		proxy.unshift('a');
		verify(1, proxy, '', ['a', {z: 1}], [{z: 1}], 'unshift');
	});
});

test('should call the callback for items returned from a handled method on array', t => {
	const array = [{z: 0}, {z: 1}];

	testHelper(t, array, {}, (proxy, verify) => {
		const returned = proxy.concat([]);
		verify(0);

		returned[0].z = 3;
		verify(1, proxy, '0.z', 3, 0);
	});
});

test('should call the callback for items returned from a non-handled method on array', t => {
	const array = [{z: 0}, {z: 1}];

	testHelper(t, array, {}, (proxy, verify) => {
		const returned = proxy.map(item => item);
		verify(0);

		returned[0].z = 3;
		verify(1, proxy, '0.z', 3, 0);
	});
});

test('should allow nested proxied objects', t => {
	const object1 = {
		x: {
			y: [
				{
					z: 0
				}
			]
		}
	};
	const object2 = {
		a: {
			b: [
				{
					c: 0
				}
			]
		}
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
		returnedObject1 = this;
		returnedPath1 = path;
		returnedValue1 = value;
		returnedPrevious1 = previous;
		callCount1++;
	});
	const proxy2 = onChange(object2, function (path, value, previous) {
		returnedObject2 = this;
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
					z: 0
				}
			]
		}
	};
	const object2 = {
		a: {
			b: [
				{
					c: 0
				}
			]
		}
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
		returnedObject1 = this;
		returnedPath1 = path;
		returnedValue1 = value;
		returnedPrevious1 = previous;
		callCount1++;
	}, {pathAsArray: true});
	const proxy2 = onChange(object2, function (path, value, previous) {
		returnedObject2 = this;
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
		method
	};

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.method(proxy);
		verify(1, proxy, '', {x: 1, method}, {
			x: 0,
			method
		}, 'method');
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

	testHelper(t, new TestClass(), {}, (proxy, verify) => {
		proxy.method();
		verify(1, proxy, '', new TestClass(1), {
			x: 0
		}, 'method');
	});
});

test('should not trigger after unsubscribe is called', t => {
	const object = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	testHelper(t, object, {}, (proxy, verify, reset) => {
		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);

		let unsubscribed = onChange.unsubscribe(proxy);
		reset();

		proxy.z = false;
		verify(0);

		unsubscribed.x.y[0].z = true;
		verify(0);

		unsubscribed = onChange.unsubscribe(unsubscribed);

		unsubscribed.x.y[0].z = true;
		verify(0);
	});
});

test('should trigger if a new property is set to undefined', t => {
	const object = {
		x: true
	};

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.z = undefined;
		verify(1, proxy, 'z', undefined, undefined);
	});
});

test('should NOT trigger if defining a property fails', t => {
	const object = {
		x: true
	};

	Object.freeze(object);

	testHelper(t, object, {}, (proxy, verify) => {
		t.throws(() => {
			Object.defineProperty(proxy, 'y', {
				configurable: false,
				writable: false,
				value: false
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
		value: 1
	});

	Object.defineProperty(object, 'y', {
		configurable: true,
		value: 2
	});

	testHelper(t, object, {}, (proxy, verify) => {
		t.not(proxy.x, 3);
		t.not(proxy.y, 3);

		Object.defineProperty(proxy, 'x', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: 1
		});
		verify(0);

		Object.defineProperty(proxy, 'y', {
			configurable: true,
			enumerable: false,
			writable: false,
			value: 2
		});
		verify(0);
	});
});

test('should NOT trigger if setting a property fails', t => {
	const object = {
		x: true
	};

	Object.freeze(object);

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.x = false;

		verify(0, undefined, undefined, undefined, undefined);
	});
});

test('should NOT trigger if deleting a property fails', t => {
	const object = {
		x: true
	};

	Object.freeze(object);

	testHelper(t, object, {}, (proxy, verify) => {
		delete proxy.x;

		verify(0);
	});
});

test('should only execute once if map is called within callback', t => {
	let count = 0;

	const object = {
		arr: [],
		foo: true
	};

	const proxy = onChange(object, function () {
		count++;
		this.arr.map(item => item);
	});

	proxy.arr.unshift('value');

	t.is(count, 1);
});

test('should return an array iterator when array.keys is called', t => {
	let count = 0;
	let callbackCount = 0;
	const array = ['a', 'b', 'c'];

	const proxy = onChange(array, () => {
		callbackCount++;
	});

	for (const index of proxy.keys()) {
		t.is(count++, index);
	}

	t.is(callbackCount, 0);
});

test('should return an array iterator when array.entries is called', t => {
	let count = 0;
	let callbackCount = 0;
	const array = [{a: 0}, {a: 1}, {a: 2}];

	const proxy = onChange(array, () => {
		callbackCount++;
	});

	for (const [index, element] of proxy.entries()) {
		t.is(count++, index);
		t.is(callbackCount, element.a);
		element.a++;
		t.is(callbackCount, element.a);
	}

	t.is(callbackCount, 3);
});

test('should handle shallow changes to Sets', t => {
	const object = {a: 0};
	const set = new Set();

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = set;
		t.true(proxy.a instanceof Set);
		verify(1, proxy, 'a', set, 0);

		let clone = new Set(set);
		proxy.a.add(32);
		verify(2, proxy, 'a', set, clone, 'add');

		clone = new Set(set);
		proxy.a.add(64);
		verify(3, proxy, 'a', set, clone, 'add');

		clone = new Set(set);
		proxy.a.delete(32);
		verify(4, proxy, 'a', set, clone, 'delete');

		proxy.a.delete(32);
		verify(4, proxy, 'a', set, clone, 'delete');

		clone = new Set(set);
		proxy.a.clear();
		verify(5, proxy, 'a', set, clone, 'clear');
	});
});

test('should handle shallow changes to WeakSets', t => {
	const object = {a: 0};
	const set = new WeakSet();
	const setObject = {x: 2};

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = set;
		t.true(proxy.a instanceof WeakSet);
		verify(1, proxy, 'a', set, 0);

		proxy.a.add(setObject);
		verify(2, proxy, 'a', set, undefined, 'add');

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', set, undefined, 'delete');

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', set, undefined, 'delete');
	});
});

test('should handle shallow changes to Maps', t => {
	const object = {a: 0};
	const map = new Map();

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = map;
		t.true(proxy.a instanceof Map);
		verify(1, proxy, 'a', map, 0);

		let clone = new Map(map);
		proxy.a.set(32, true);
		verify(2, proxy, 'a', map, clone, 'set');

		clone = new Map(map);
		proxy.a.delete(32);
		verify(3, proxy, 'a', map, clone, 'delete');

		proxy.a.delete(32);
		verify(3, proxy, 'a', map, clone, 'delete');
	});
});

test('should handle shallow changes to WeakMaps', t => {
	const object = {a: 0};
	const map = new WeakMap();
	const setObject = {x: 2};

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = map;
		t.true(proxy.a instanceof WeakMap);
		verify(1, proxy, 'a', map, 0);

		proxy.a.set(setObject, true);
		verify(2, proxy, 'a', map, undefined, 'set');

		proxy.a.delete(setObject);
		verify(3, proxy, 'a', map, undefined, 'delete');

		proxy.a.delete(32);
		verify(3, proxy, 'a', map, undefined, 'delete');
	});
});
