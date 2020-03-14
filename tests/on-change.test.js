const onChange = require('..');
const displayValue = require('display-value');
const test = require('ava');

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

	const proxy = onChange(object, function (path, value, previous) {
		last.count++;
		last.thisArg = this;
		last.path = path;
		last.value = value;
		last.previous = previous;
	}, options);

	// eslint-disable-next-line max-params
	const verify = (count, thisArg, path, value, previous, fullObject) => {
		t.is(count, last.count);
		t.is(thisArg, last.thisArg);
		t.deepEqual(path, last.path);
		t.deepEqual(value, last.value);
		t.deepEqual(previous, last.previous);

		t.is(object, onChange.target(proxy));

		if (fullObject !== undefined) {
			t.deepEqual(fullObject, object);
			t.deepEqual(proxy, object);
		}
	};

	callback(proxy, verify, reset, last);

	onChange.unsubscribe(proxy);
};

const testValues = [
	null,
	undefined,
	'string',
	new RegExp('regExp1'), // eslint-disable-line prefer-regex-literals
	RegExp('regExp2'), // eslint-disable-line unicorn/new-for-builtins, prefer-regex-literals
	/regExp3/,
	true,
	false,
	1,
	'1',
	Number(2),
	new Number(3), // eslint-disable-line no-new-wrappers, unicorn/new-for-builtins
	Infinity,
	0,
	-0,
	NaN
];

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

for (const [index1, value1] of testValues.entries()) {
	for (const [index2, value2] of testValues.entries()) {
		if (index1 !== index2) {
			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1]
				};

				testHelper(t, object, {}, (proxy, verify) => {
					proxy.a = value2;
					t.is(proxy.a, value2);
					verify(1, proxy, 'a', value2, value1);

					proxy.a = value2;
					verify(1, proxy, 'a', value2, value1);

					proxy.b[2] = value2;
					t.is(proxy.b[2], value2);
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

			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)} when pathAsArray is true`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1]
				};

				testHelper(t, object, {pathAsArray: true}, (proxy, verify) => {
					proxy.a = value2;
					t.is(proxy.a, value2);
					verify(1, proxy, ['a'], value2, value1);

					proxy.a = value2;
					verify(1, proxy, ['a'], value2, value1);

					proxy.b[2] = value2;
					t.is(proxy.b[2], value2);
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
	const date = new Date('1/1/2001');

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.a = date;
		t.true(proxy.a instanceof Date);
		verify(1, proxy, 'a', date, 0);

		let clone = date.valueOf();
		proxy.a.setSeconds(32);
		verify(2, proxy, 'a', date, clone);

		clone = date.valueOf();
		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone);

		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone);
	});
});

test('should trigger once when an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy[0] = 'a';
		verify(1, proxy, '0', 'a', 1, ['a', 2, {a: false}]);
	});
});

test('should trigger once when a property of an array element is set with an array as the main object', t => {
	const object = [1, 2, {a: false}];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy[2].a = true;
		verify(1, proxy, '2.a', true, false, [1, 2, {a: true}]);
	});
});

test('should trigger once when an array is sorted with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.sort();
		verify(1, proxy, '', [1, 2, 3], [2, 3, 1], [1, 2, 3]);
	});
});

test('should trigger once when an array is popped with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.pop();
		verify(1, proxy, '', [2, 3], [2, 3, 1], [2, 3]);
	});
});

test('should trigger once when an array is reversed with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.reverse();
		verify(1, proxy, '', [1, 3, 2], [2, 3, 1], [1, 3, 2]);
	});
});

test('should trigger once when an array is spliced with an array as the main object', t => {
	const object = [2, 3, 1];

	testHelper(t, object, {}, (proxy, verify) => {
		proxy.splice(1, 1, 'a', 'b');
		verify(1, proxy, '', [2, 'a', 'b', 1], [2, 3, 1], [2, 'a', 'b', 1]);
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

	proxy.useAccessor = 10;
	t.is(proxy.useAccessor, 10);
	t.is(callCount, 1);

	proxy.useAccessor = 20;
	t.is(proxy.useAccessor, 20);
	t.is(callCount, 2);
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
		verify(4, proxy, 'x.y', [{z: 1}, 'pushed'], [{z: 1}]);

		proxy.x.y.pop();
		verify(5, proxy, 'x.y', [{z: 1}], [{z: 1}, 'pushed']);

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, 'x.y', ['unshifted', {z: 1}], [{z: 1}]);

		proxy.x.y.shift();
		verify(7, proxy, 'x.y', [{z: 1}], ['unshifted', {z: 1}]);

		proxy.x.y = proxy.x.y.concat([{z: 3}, {z: 2}]);
		verify(8, proxy, 'x.y', [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		proxy.x.y.sort((a, b) => a.z - b.z);
		verify(9, proxy, 'x.y', [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}]);

		proxy.x.y.reverse();
		verify(10, proxy, 'x.y', [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}]);

		proxy.x.y.forEach(item => item.z++);
		verify(11, proxy, 'x.y', [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}]);

		proxy.x.y.splice(1, 2);
		verify(12, proxy, 'x.y', [{z: 4}], [{z: 4}, {z: 3}, {z: 2}]);

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
		verify(4, proxy, ['x', 'y'], [{z: 1}, 'pushed'], [{z: 1}]);

		proxy.x.y.pop();
		verify(5, proxy, ['x', 'y'], [{z: 1}], [{z: 1}, 'pushed']);

		proxy.x.y.unshift('unshifted');
		verify(6, proxy, ['x', 'y'], ['unshifted', {z: 1}], [{z: 1}]);

		proxy.x.y.shift();
		verify(7, proxy, ['x', 'y'], [{z: 1}], ['unshifted', {z: 1}]);

		proxy.x.y = proxy.x.y.concat([{z: 3}, {z: 2}]);
		verify(8, proxy, ['x', 'y'], [{z: 1}, {z: 3}, {z: 2}], [{z: 1}]);

		proxy.x.y.sort((a, b) => a.z - b.z);
		verify(9, proxy, ['x', 'y'], [{z: 1}, {z: 2}, {z: 3}], [{z: 1}, {z: 3}, {z: 2}]);

		proxy.x.y.reverse();
		verify(10, proxy, ['x', 'y'], [{z: 3}, {z: 2}, {z: 1}], [{z: 1}, {z: 2}, {z: 3}]);

		proxy.x.y.forEach(item => item.z++);
		verify(11, proxy, ['x', 'y'], [{z: 4}, {z: 3}, {z: 2}], [{z: 3}, {z: 2}, {z: 1}]);

		proxy.x.y.splice(1, 2);
		verify(12, proxy, ['x', 'y'], [{z: 4}], [{z: 4}, {z: 3}, {z: 2}]);

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

		proxy.reduce((result, item) => {
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
		verify(1, proxy, 'x.y', [{z: 0}, 'pushed'], [{z: 0}]);

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
		verify(1, proxy, ['x', 'y'], [{z: 0}, 'pushed'], [{z: 0}]);

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

test('should not call the callback for nested items if isShallow is true', t => {
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

	testHelper(t, new TestClass(), {}, (proxy, verify) => {
		proxy.method();
		verify(1, proxy, '', new TestClass(1), {
			x: 0
		});
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
