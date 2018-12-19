import test from 'ava';
import onChange from '.';

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
	t.is(callCount, 1);

	Object.defineProperty(object, 'newProp', {
		value: '🦄'
	});
	t.is(callCount, 2);

	Object.assign(object, {foo: false});
	t.is(callCount, 3);

	delete object.foo;
	t.is(callCount, 4);

	object.bar.a.b = 1;
	t.is(object.bar.a.b, 1);
	t.is(callCount, 5);

	object.bar.a.c[2] = 5;
	t.is(object.bar.a.c[2], 5);
	t.is(callCount, 6);
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
