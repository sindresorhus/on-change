import test from 'ava';
import onChange from '../index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';

setOnChange(onChange);

test('should provide the same arguments for onValidate as onChange', t => {
	const object = [{x: 1}];
	let callCount = 0;
	let context = {};
	let validateArgs;

	const onValidate = function () {
		context = this; // eslint-disable-line unicorn/no-this-assignment
		validateArgs = arguments; // eslint-disable-line prefer-rest-params
		return true;
	};

	const proxy = onChange(object, function () {
		callCount++;
		t.is(context, this);
		t.deepEqual(validateArgs, arguments); // eslint-disable-line prefer-rest-params
	}, {onValidate});

	proxy[0].x = 2;

	t.is(callCount, 1);

	for (const item of proxy) {
		item.x = 3;
	}

	t.is(callCount, 2);
});

test('should execute when a property is set and onValidate returns true', t => {
	const object = {x: 1};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		proxy.x = 2;
		verify(1, proxy, 'x', 2, 1);
	});
});

test('should execute when a property is defined and onValidate returns true', t => {
	const object = {};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		Object.defineProperty(proxy, 'x', {
			value: true,
			configurable: true,
			writable: true,
			enumerable: true,
		});
		verify(1, proxy, 'x', true);
	});
});

test('should execute when a property is deleted and onValidate returns true', t => {
	const object = {x: 1};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		delete proxy.x;
		verify(1, proxy, 'x', undefined, 1);
	});
});

test('should execute when a method is applied and onValidate returns true', t => {
	const object = [{x: 1}, {x: 3}];
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		const forEachCallback = item => {
			item.x = 2;
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(1, proxy, '', [{x: 2}, {x: 2}], [{x: 1}, {x: 3}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});
	});
});

test('should not execute when a property is set and onValidate returns false', t => {
	const object = {x: 1};
	const onValidate = () => false;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		proxy.x = 2;
		verify(0);

		t.is(proxy.x, 1);
	});
});

test('should not execute when a property is defined and onValidate returns false', t => {
	const object = {};
	const onValidate = () => false;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		Object.defineProperty(proxy, 'x', {
			value: true,
			configurable: true,
			writable: true,
			enumerable: true,
		});
		verify(0);

		t.is(proxy.x, undefined);
	});
});

test('should not execute when a property is deleted and onValidate returns false', t => {
	const object = {x: 1};
	const onValidate = () => false;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		delete proxy.x;
		verify(0);

		t.is(proxy.x, 1);
	});
});

test('should not execute when a method is applied and onValidate returns false', t => {
	const object = [{x: 1}];
	const onValidate = () => false;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		const forEachCallback = item => {
			item.x = 2;
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(0);

		t.is(proxy[0].x, 1);
	});
});

test('should not execute when a property is set to the same value and onValidate returns true', t => {
	const object = {x: 1};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		proxy.x = 1;
		verify(0);
	});
});

test('should not execute when a property is defined to the same value and onValidate returns true', t => {
	const object = {x: true};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		Object.defineProperty(proxy, 'x', {
			value: true,
			configurable: true,
			writable: true,
			enumerable: true,
		});
		verify(0);
	});
});

test('should not execute when a property is deleted that didn\'t exist and onValidate returns true', t => {
	const object = {};
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		delete proxy.x;
		verify(0);
	});
});

test('should not execute when a method is applied without changes and onValidate returns true', t => {
	const object = [{x: 1}];
	const onValidate = () => true;

	testRunner(t, object, {onValidate}, (proxy, verify) => {
		for (const item of proxy) {
			item.x = 1;
		}

		verify(0);
	});
});

test('should revert deep changes in apply trap when onValidate returns false', t => {
	const object = [{x: 1}];
	const onValidate = () => false;

	testRunner(t, object, {onValidate, pathAsArray: true}, (proxy, verify) => {
		const forEachCallback = item => {
			item.x = {y: {z: 3}};
			item.x.y.z = 2;
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(0);

		t.is(proxy[0].x, 1);
	});
});

test('should revert deep changes in nested apply traps when onValidate returns false', t => {
	const object = [{x: [1, 2, 3]}];
	let validateCount = 0;
	const onValidate = () => {
		validateCount++;
		return false;
	};

	testRunner(t, object, {onValidate, pathAsArray: true}, (proxy, verify) => {
		const forEachCallback = item => {
			item.x.push(2);
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(0);

		t.is(validateCount, 1);
		t.deepEqual(proxy[0].x, [1, 2, 3]);
	});
});

test('should revert deep changes in nested apply traps when onValidate returns false details is true', t => {
	const object = [{x: [1, 2, 3]}];
	let validateCount = 0;
	const onValidate = () => {
		validateCount++;
		return false;
	};

	testRunner(t, object, {onValidate, pathAsArray: true, details: true}, (proxy, verify) => {
		const forEachCallback = item => {
			item.x.push(4);
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each
		verify(0);

		t.is(validateCount, 2);
		t.deepEqual(proxy[0].x, [1, 2, 3]);
	});
});

test('should revert changes in Sets when onValidate returns false', t => {
	const set = new Set([16, 32]);
	const onValidate = () => false;

	testRunner(t, set, {onValidate}, (proxy, verify) => {
		proxy.add(64);

		verify(0);

		t.false(proxy.has(64));
	});
});

test('should revert changes in WeakSets when onValidate returns false', t => {
	const object1 = {};
	const object2 = {};
	const set = new WeakSet([object1]);
	const onValidate = () => false;

	testRunner(t, set, {onValidate}, (proxy, verify) => {
		proxy.add(object2);

		verify(0);
		t.false(proxy.has(object2));

		proxy.delete(object1);

		verify(0);
		t.true(proxy.has(object1));
	});
});

test('should revert changes in Maps when onValidate returns false', t => {
	const map = new Map();
	const onValidate = () => false;

	map.set(16, 32);

	testRunner(t, map, {onValidate}, (proxy, verify) => {
		proxy.set(64, 128);

		verify(0);

		t.false(proxy.has(64));
	});
});

test('should revert changes in WeakMaps when onValidate returns false', t => {
	const object1 = {};
	const object2 = {};
	const map = new WeakMap();
	const onValidate = () => false;

	map.set(object1, 32);

	testRunner(t, map, {onValidate}, (proxy, verify) => {
		proxy.set(object2, 128);

		verify(0);
		t.false(proxy.has(object2));

		proxy.set(object1, 128);

		verify(0);
		t.true(proxy.has(object1));

		proxy.delete(object1);

		verify(0);
		t.true(proxy.has(object1));
	});
});

test('should revert mutable changes in Dates when onValidate returns false', t => {
	const date = new Date('1/1/2001');
	const onValidate = () => false;

	testRunner(t, date, {onValidate}, (proxy, verify) => {
		proxy.setMonth(5);

		verify(0);

		t.is(proxy.getMonth(), 0);
	});
});
