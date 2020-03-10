const path = require('../lib/path');
const test = require('ava');

test('after should return the remainder of the first path after the second path', t => {
	t.is(path.after('a.0.b', 'a.0'), 'b');
});

test('after should handle an empty sub path', t => {
	t.is(path.after('a.0.b', ''), 'a.0.b');
});

test('after should return the remainder of the first path after the second path when arrays', t => {
	t.deepEqual(path.after(['a', '0', 'b'], ['a', '0']), ['b']);
});

test('concat should return an initial property', t => {
	t.is(path.concat('', 'key'), 'key');
});

test('concat should add a separator', t => {
	t.is(path.concat('a', 'b'), 'a.b');
});

test('concat should not add an empty string', t => {
	t.is(path.concat('a', ''), 'a');
});

test('concat should not add undefined', t => {
	t.is(path.concat('a', undefined), 'a');
});

test('concat should add a Symbol', t => {
	t.is(path.concat('a', Symbol('test')), 'a.Symbol(test)');
});

test('concat should return an initial property in an array', t => {
	const orig = [];
	const key = 'key';
	const result = path.concat(orig, key);

	t.not(result, orig);
	t.deepEqual(result, ['key']);
});

test('concat should add a key in an array', t => {
	const orig = ['a'];
	const key = 'b';
	const result = path.concat(orig, key);

	t.not(result, orig);
	t.deepEqual(result, ['a', 'b']);
});

test('concat should not add an empty string in an array', t => {
	const orig = ['a'];
	const key = '';
	const result = path.concat(orig, key);

	t.not(result, orig);
	t.deepEqual(result, ['a']);
});

test('concat should not add undefined in an array', t => {
	const orig = ['a'];
	const key = undefined;
	const result = path.concat(orig, key);

	t.not(result, orig);
	t.deepEqual(result, ['a']);
});

test('concat should add a Symbol to an array', t => {
	const orig = ['a'];
	const symbol = Symbol('test');
	const result = path.concat(orig, symbol);

	t.not(result, orig);
	t.deepEqual(result, ['a', symbol]);
});

test('initial should return an empty string if an empty string is provided', t => {
	t.is(path.initial(''), '');
});

test('initial should return an empty string if a single key is provided', t => {
	t.is(path.initial('key'), '');
});

test('initial should return all but the last key', t => {
	t.is(path.initial('a.0.b'), 'a.0');
});

test('initial should return an empty array if an empty array is provided', t => {
	const array = [];

	t.not(path.initial(array), array);
	t.deepEqual(path.initial(array), []);
});

test('initial should return an empty array if a single key is provided', t => {
	const array = ['key'];

	t.not(path.initial(array), array);
	t.deepEqual(path.initial(array), []);
});

test('initial should return all but the last key in an array', t => {
	const array = ['a', '0', 'b'];

	t.not(path.initial(array), array);
	t.deepEqual(path.initial(array), ['a', '0']);
});

test('walk should not call the callback if path is empty', t => {
	path.walk('', () => {
		t.fail();
	});

	t.pass();
});

test('walk should call the callback once with a single key', t => {
	let count = 0;

	path.walk('a', key => {
		count++;
		t.is(key, 'a');
	});

	t.is(count, 1);
});

test('walk should call the callback for each key', t => {
	let count = 0;

	path.walk('a.0.b', key => {
		count++;

		if (count === 1) {
			t.is(key, 'a');
		} else if (count === 2) {
			t.is(key, '0');
		} else if (count === 3) {
			t.is(key, 'b');
		}
	});

	t.is(count, 3);
});

test('walk should not call the callback if path is an empty array', t => {
	path.walk([], () => {
		t.fail();
	});

	t.pass();
});

test('walk should call the callback once with a single key in an array', t => {
	let count = 0;

	path.walk(['a'], key => {
		count++;
		t.is(key, 'a');
	});

	t.is(count, 1);
});

test('walk should call the callback for each key in an array', t => {
	let count = 0;
	const symbol = Symbol('test');

	path.walk(['a', '0', symbol], key => {
		count++;

		if (count === 1) {
			t.is(key, 'a');
		} else if (count === 2) {
			t.is(key, '0');
		} else if (count === 3) {
			t.is(key, symbol);
		}
	});

	t.is(count, 3);
});
