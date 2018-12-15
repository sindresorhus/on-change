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
	t.deepEqual(array, ['a', 2, {a: false}]);
	t.is(callCount, 1);

	array[2].a = true;
	t.is(callCount, 2);

	array.sort();
	t.is(callCount, 6);

	array.pop();
	t.is(callCount, 8);
});

// https://github.com/sindresorhus/on-change/issues/14
test.failing('Array#splice works', t => {
	const array = onChange([1, 2, 3], () => {});

	t.notThrows(() => {
		array.splice(0, 1);
	});
});
