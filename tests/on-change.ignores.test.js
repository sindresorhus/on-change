import test from 'ava';
import onChange from '../index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';

setOnChange(onChange);

test('should trigger the callback when a Symbol is used as the key and ignoreSymbols is not set', t => {
	const object = {
		x: {
			y: [{
				z: 0,
			}],
		},
	};

	testRunner(t, object, {}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');

		proxy[SYMBOL] = true;
		verify(1, proxy, 'Symbol(test)', true, undefined);

		Object.defineProperty(proxy, SYMBOL2, {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false,
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
				z: 0,
			}],
		},
	};

	testRunner(t, object, {pathAsArray: true}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');

		proxy[SYMBOL] = true;
		verify(1, proxy, [SYMBOL], true, undefined);

		Object.defineProperty(proxy, SYMBOL2, {
			value: true,
			configurable: true,
			writable: true,
			enumerable: false,
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
				z: 0,
			}],
		},
	};

	testRunner(t, object, {ignoreSymbols: true}, (proxy, verify) => {
		const SYMBOL = Symbol('test');
		const SYMBOL2 = Symbol('test2');
		const object2 = {
			c: 2,
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
			enumerable: false,
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
				z: 0,
			}],
		},
	};

	testRunner(t, object, {ignoreKeys: ['a', 'b']}, (proxy, verify) => {
		const object2 = {
			c: 2,
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
			enumerable: false,
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
				z: 0,
			}],
		},
	};

	testRunner(t, object, {ignoreUnderscores: true}, (proxy, verify) => {
		const object2 = {
			c: 2,
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
			enumerable: false,
		});
		verify(0);

		delete proxy._b;
		verify(0);

		proxy.z = true;
		verify(1, proxy, 'z', true, undefined);
	});
});
