import test from 'ava';
import onChange from '../index.js';

test('defineProperty with accessor descriptor reports correct value from getter', t => {
	const backing = {x: 1};
	const object = {};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	Object.defineProperty(proxy, 'x', {
		get() {
			return backing.x;
		},
		set(v) {
			backing.x = v;
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'x');
	t.is(events[0].value, 1, 'Value should be from getter, not undefined');
	t.is(events[0].previous, undefined);

	// Verify the property works
	t.is(proxy.x, 1);

	// Test setter
	proxy.x = 2;
	t.is(proxy.x, 2);
	t.is(events.length, 2);
	t.is(events[1].value, 2);
});

test('defineProperty with getter only', t => {
	const object = {};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	Object.defineProperty(proxy, 'timestamp', {
		get() {
			return Date.now();
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'timestamp');
	t.true(typeof events[0].value === 'number', 'Should report the getter value');
	t.is(events[0].previous, undefined);
});

test('defineProperty with setter only', t => {
	const object = {};
	const events = [];
	let storedValue;

	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	// eslint-disable-next-line accessor-pairs
	Object.defineProperty(proxy, 'writeOnly', {
		set(v) {
			storedValue = v;
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'writeOnly');
	t.is(events[0].value, undefined, 'Setter-only property has undefined value');
	t.is(events[0].previous, undefined);

	// Test setter
	proxy.writeOnly = 'test';
	t.is(storedValue, 'test');
});

test('defineProperty with throwing getter', t => {
	const object = {};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	Object.defineProperty(proxy, 'throwing', {
		get() {
			throw new Error('Getter error');
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'throwing');
	t.is(events[0].value, undefined, 'Throwing getter results in undefined value');
	t.is(events[0].previous, undefined);

	// Verify getter throws when accessed
	t.throws(() => proxy.throwing, {message: 'Getter error'});
});

test('Vue-like scenario - converting value property to getter/setter with same value', t => {
	const object = {
		foo: 'initial',
	};

	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	const originalValue = object.foo;

	// Simulate Vue converting a property to getter/setter
	let hiddenValue = originalValue;
	Object.defineProperty(proxy, 'foo', {
		get() {
			return hiddenValue;
		},
		set(newValue) {
			hiddenValue = newValue;
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'foo');
	t.is(events[0].value, 'initial', 'Should report the value from getter');
	t.is(events[0].previous, 'initial', 'Previous value should be preserved');

	// Verify the property still works
	t.is(proxy.foo, 'initial');

	// Test setter
	proxy.foo = 'changed';
	t.is(proxy.foo, 'changed');
	t.is(events.length, 2);
	t.is(events[1].value, 'changed');
});

test('defineProperty with data descriptor (value property)', t => {
	const object = {};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	Object.defineProperty(proxy, 'data', {
		value: 'test',
		writable: true,
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].path, 'data');
	t.is(events[0].value, 'test', 'Data descriptor value should be reported');
	t.is(events[0].previous, undefined);

	t.is(proxy.data, 'test');
});

test('redefining property from data to accessor descriptor', t => {
	const object = {value: 'initial'};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	events.length = 0; // Clear initial state

	// Convert from data to accessor
	let backing = 'converted';
	Object.defineProperty(proxy, 'value', {
		get() {
			return backing;
		},
		set(v) {
			backing = v;
		},
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].value, 'converted', 'Should report new value from getter');
	t.is(events[0].previous, 'initial', 'Should preserve previous value');
});

test('redefining property from accessor to data descriptor', t => {
	const object = {};
	const events = [];
	const proxy = onChange(object, (path, value, previous) => {
		events.push({path, value, previous});
	});

	// First define as accessor
	Object.defineProperty(proxy, 'prop', {
		get() {
			return 'from-getter';
		},
		enumerable: true,
		configurable: true,
	});

	events.length = 0; // Clear

	// Convert to data descriptor
	Object.defineProperty(proxy, 'prop', {
		value: 'data-value',
		writable: true,
		enumerable: true,
		configurable: true,
	});

	t.is(events.length, 1);
	t.is(events[0].value, 'data-value', 'Should report the data value');
	t.is(events[0].previous, 'from-getter', 'Previous value should be from getter');
});
