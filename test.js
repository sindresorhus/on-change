import test from 'ava';
import displayValue from 'display-value';
import onChange from '.';

const testValues = [
	null,
	undefined,
	'string',
	new RegExp('regExp1'),
	RegExp('regExp2'), // eslint-disable-line unicorn/new-for-builtins
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
	const fixture = {
		foo: false,
		bar: {
			a: {
				b: 0,
				c: [1, 2]
			}
		}
	};

	let callCount = 0;

	const object = onChange(fixture, () => {
		callCount++;
	});

	object.foo = true;
	t.is(object.constructor, Object);
	t.is(callCount, 1);

	Object.defineProperty(object, 'newProp', {
		value: '🦄'
	});
	t.is(callCount, 2);

	Object.assign(object, {foo: false});
	t.is(callCount, 3);

	delete object.foo;
	t.is(object.foo, undefined);
	t.is(callCount, 4);

	// Unwrap proxies on assignment
	const prev = fixture.bar.a;
	object.bar.a = object.bar.a; // eslint-disable-line no-self-assign
	t.is(fixture.bar.a, prev);
});

for (const [index1, value1] of testValues.entries()) {
	for (const [index2, value2] of testValues.entries()) {
		if (index1 !== index2) {
			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)}`, t => {
				const fixture = {
					a: value1,
					b: [1, 2, value1]
				};

				let callCount = 0;

				const proxy = onChange(fixture, () => {
					callCount++;
				});

				proxy.a = value2;
				t.is(proxy.a, value2);
				t.is(callCount, 1);

				proxy.a = value2;
				t.is(callCount, 1);

				proxy.b[2] = value2;
				t.is(proxy.b[2], value2);
				t.is(callCount, 2);

				proxy.b[2] = value2;
				t.is(callCount, 2);

				delete proxy.nonExistent;
				t.is(callCount, 2);

				delete proxy.b;
				t.is(proxy.b, undefined);
				t.is(callCount, 3);
			});
		}
	}
}

test('dates', t => {
	let callCount = 0;
	const object = onChange({
		a: 0
	}, () => {
		callCount++;
	});

	const date = new Date('1/1/2001');

	object.a = date;
	t.true(object.a instanceof Date);
	t.is(object.a.valueOf(), date.valueOf());
	t.is(callCount, 1);

	object.a.setSeconds(32);
	t.is(callCount, 2);

	object.a.setHours(5);
	t.is(callCount, 3);

	object.a.setHours(5);
	t.is(callCount, 3);
});

test('works with an array too', t => {
	const fixture = [1, 2, {a: false}];

	let callCount = 0;

	const array = onChange(fixture, () => {
		callCount++;
	});
	array[0] = 'a';
	t.deepEqual(fixture, ['a', 2, {a: false}]);
	t.deepEqual(array, fixture);
	t.is(callCount, 1);

	array[2].a = true;
	t.deepEqual(fixture, ['a', 2, {a: true}]);
	t.deepEqual(array, fixture);
	t.is(callCount, 2);

	array.sort();
	t.deepEqual(fixture, [2, {a: true}, 'a']);
	t.deepEqual(array, fixture);
	t.is(callCount, 3);

	array.pop();
	t.deepEqual(fixture, [2, {a: true}]);
	t.deepEqual(array, fixture);
	t.is(callCount, 4);

	array[2] = false;
	t.deepEqual(fixture, [2, {a: true}, false]);
	t.deepEqual(array, fixture);
	t.is(callCount, 5);

	array.reverse();
	t.deepEqual(fixture, [false, {a: true}, 2]);
	t.deepEqual(array, fixture);
	t.is(callCount, 6);

	array.reverse();
	t.deepEqual(fixture, [2, {a: true}, false]);
	t.deepEqual(array, fixture);
	t.is(callCount, 7);

	array.splice(1, 1, 'a', 'b');
	t.deepEqual(fixture, [2, 'a', 'b', false]);
	t.deepEqual(array, fixture);
	t.is(callCount, 8);
});

test('invariants', t => {
	const fixture = {};
	Object.defineProperty(fixture, 'nonWritable', {
		configurable: false,
		writable: false,
		value: {a: true}
	});
	// eslint-disable-next-line accessor-pairs
	Object.defineProperty(fixture, 'nonReadable', {
		configurable: false,
		set: () => {} // No-Op setter
	});
	Object.defineProperty(fixture, 'useAccessor', {
		configurable: false,
		set(val) {
			this._useAccessor = val;
		},
		get() {
			return this._useAccessor;
		}
	});

	let callCount = 0;

	const proxy = onChange(fixture, () => {
		callCount++;
	});

	t.is(proxy.nonWritable, fixture.nonWritable);
	t.is(proxy.nonReadable, undefined);

	proxy.useAccessor = 10;
	t.is(proxy.useAccessor, 10);
	t.is(callCount, 1);
});

test.cb('the change handler is called after the change is done', t => {
	const object = onChange({x: 0}, () => {
		t.is(object.x, 1);
		t.end();
	});

	object.x = 1;
});

test('the callback should provide the original proxied object, the path to the changed value, the previous value at path, and the new value at path', t => {
	const originalObject = {
		x: {
			y: [
				{
					z: 0
				}
			]
		}
	};

	let callCount = 0;
	let returnedObject;
	let returnedPath;
	let returnedPrevious;
	let returnedValue;

	const proxy = onChange(originalObject, function (path, value, previous) {
		returnedObject = this;
		returnedPath = path;
		returnedValue = value;
		returnedPrevious = previous;
		callCount++;
	});

	proxy.x.y[0].z = 1;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y.0.z');
	t.is(returnedPrevious, 0);
	t.is(returnedValue, 1);
	t.is(callCount, 1);

	proxy.x.y[0].new = 1;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y.0.new');
	t.is(returnedPrevious, undefined);
	t.is(returnedValue, 1);
	t.is(callCount, 2);

	delete proxy.x.y[0].new;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y.0.new');
	t.is(returnedPrevious, 1);
	t.is(returnedValue, undefined);
	t.is(callCount, 3);

	proxy.x.y.push('pushed');
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}]);
	t.deepEqual(returnedValue, [{z: 1}, 'pushed']);
	t.is(callCount, 4);

	proxy.x.y.pop();
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}, 'pushed']);
	t.deepEqual(returnedValue, [{z: 1}]);
	t.is(callCount, 5);

	proxy.x.y.unshift('unshifted');
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}]);
	t.deepEqual(returnedValue, ['unshifted', {z: 1}]);
	t.is(callCount, 6);

	proxy.x.y.shift();
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, ['unshifted', {z: 1}]);
	t.deepEqual(returnedValue, [{z: 1}]);
	t.is(callCount, 7);

	proxy.x.y = proxy.x.y.concat([{z: 3}, {z: 2}]);
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}]);
	t.deepEqual(returnedValue, [{z: 1}, {z: 3}, {z: 2}]);
	t.is(callCount, 8);

	proxy.x.y.sort((a, b) => a.z - b.z);
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}, {z: 3}, {z: 2}]);
	t.deepEqual(returnedValue, [{z: 1}, {z: 2}, {z: 3}]);
	t.is(callCount, 9);

	proxy.x.y.reverse();
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 1}, {z: 2}, {z: 3}]);
	t.deepEqual(returnedValue, [{z: 3}, {z: 2}, {z: 1}]);
	t.is(callCount, 10);

	proxy.x.y.forEach(item => item.z++);
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 3}, {z: 2}, {z: 1}]);
	t.deepEqual(returnedValue, [{z: 4}, {z: 3}, {z: 2}]);
	t.is(callCount, 11);

	proxy.x.y.splice(1, 2);
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 4}, {z: 3}, {z: 2}]);
	t.deepEqual(returnedValue, [{z: 4}]);
	t.is(callCount, 12);

	proxy.foo = function () {
		proxy.x.y[0].z = 2;
	};

	t.is(callCount, 13);

	proxy.foo();
	t.is(returnedObject, proxy);
	t.is(returnedPath, '');
	t.is(callCount, 14);
});

test('the callback should return a raw value when apply traps are triggered', t => {
	const originalObject = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	let callCount = 0;
	let returnedObject;
	let returnedPath;
	let returnedPrevious;
	let returnedValue;

	const proxy = onChange(originalObject, function (path, value, previous) {
		returnedObject = this;
		returnedPath = path;
		returnedValue = value;
		returnedPrevious = previous;
		callCount++;
	});

	proxy.x.y.push('pushed');
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'x.y');
	t.deepEqual(returnedPrevious, [{z: 0}]);
	t.deepEqual(returnedValue, [{z: 0}, 'pushed']);
	t.is(callCount, 1);

	returnedValue.pop();
	t.is(callCount, 1);
});

test('should not call the callback for nested items if isShallow is true', t => {
	const originalObject = {
		x: {
			y: [{
				z: 0
			}]
		}
	};

	let returnedObject;
	let returnedPath;
	let returnedPrevious;
	let returnedValue;

	const proxy = onChange(originalObject, function (path, value, previous) {
		returnedObject = this;
		returnedPath = path;
		returnedPrevious = previous;
		returnedValue = value;
	}, {
		isShallow: true
	});

	proxy.a = 1;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'a');
	t.is(returnedPrevious, undefined);
	t.is(returnedValue, 1);

	proxy.x.new = 1;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'a');
	t.is(returnedPrevious, undefined);
	t.is(returnedValue, 1);

	proxy.x.y[0].new = 1;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'a');
	t.is(returnedPrevious, undefined);
	t.is(returnedValue, 1);

	proxy.a = 2;
	t.is(returnedObject, proxy);
	t.is(returnedPath, 'a');
	t.is(returnedPrevious, 1);
	t.is(returnedValue, 2);
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

test('should be able to mutate itself', t => {
	const method = proxy => {
		proxy.x++;
	};

	const originalObject = {
		x: 0,
		method
	};

	let callCount = 0;
	let returnedObject;
	let returnedPath;
	let returnedPrevious;
	let returnedValue;

	let proxy = onChange(originalObject, function (path, value, previous) {
		returnedObject = this;
		returnedPath = path;
		returnedValue = value;
		returnedPrevious = previous;
		callCount++;
	});

	proxy.method(proxy);
	t.is(returnedObject, proxy);
	t.is(returnedPath, '');
	t.deepEqual(returnedPrevious, {
		x: 0,
		method
	});
	t.deepEqual(returnedValue.x, 1);
	t.is(callCount, 1);

	class TestClass {
		method() {
			this.x++;
		}
	}

	const testClass = new TestClass();
	testClass.x = 0;

	proxy = onChange(testClass, function (path, value, previous) {
		returnedObject = this;
		returnedPath = path;
		returnedValue = value;
		returnedPrevious = previous;
		callCount++;
	});

	proxy.method();
	t.is(returnedObject, proxy);
	t.is(returnedPath, '');
	t.deepEqual(returnedPrevious, {
		x: 0
	});
	t.deepEqual(returnedValue.x, 1);
	t.is(callCount, 2);
});
