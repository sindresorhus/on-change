import test from 'ava';
import onChange from '../index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';

setOnChange(onChange);

test('invariants', t => {
	const object = {};

	Object.defineProperty(object, 'nonWritable', {
		configurable: false,
		writable: false,
		value: {a: true},
	});
	// eslint-disable-next-line accessor-pairs
	Object.defineProperty(object, 'nonReadable', {
		configurable: false,
		set() {}, // No-Op setter
	});
	Object.defineProperty(object, 'useAccessor', {
		configurable: false,
		set(value) {
			this._useAccessor = value;
		},
		get() {
			return this._useAccessor;
		},
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
		value: value1,
	});

	t.is(callCount, 1);
	t.deepEqual(proxy.a, value1);

	Object.defineProperty(proxy, 'a', {
		configurable: true,
		writable: true,
		value: value1,
	});

	t.is(callCount, 1);
	t.deepEqual(proxy.a, value1);

	Object.defineProperty(proxy, 'a', {
		configurable: false,
		writable: true,
		value: value2,
	});

	t.is(callCount, 2);

	t.deepEqual(proxy.a, value2);

	Object.defineProperty(proxy, 'a', {
		configurable: false,
		writable: true,
		value: value2,
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
		},
	};

	testRunner(t, object, {}, (proxy, verify) => {
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
		},
	};

	testRunner(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
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
			},
		},
	};

	testRunner(t, object, {}, (proxy, verify) => {
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
			},
		},
	};

	testRunner(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
		verify(0);

		proxy.z.x = 1;
		verify(1, proxy, 'z.x', 1, 0);
	});
});
