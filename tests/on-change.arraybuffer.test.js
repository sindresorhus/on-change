import test from 'ava';
import onChange from '../source/index.js';

test('ArrayBuffer should not be proxied and byteLength should work', t => {
	const buffer = new ArrayBuffer(16);
	const object = {buffer};

	let callCount = 0;
	const proxy = onChange(object, () => {
		callCount++;
	});

	t.is(proxy.buffer.byteLength, 16);
	t.is(callCount, 0);
});

test('SharedArrayBuffer should not be proxied and byteLength should work', t => {
	const buffer = new SharedArrayBuffer(24);
	const object = {buffer};

	let callCount = 0;
	const proxy = onChange(object, () => {
		callCount++;
	});

	t.is(proxy.buffer.byteLength, 24);
	t.is(callCount, 0);
});

test('ArrayBuffer in nested object should work', t => {
	const buffer = new ArrayBuffer(32);
	const object = {
		nested: {
			data: {
				buffer,
			},
		},
	};

	let callCount = 0;
	const proxy = onChange(object, () => {
		callCount++;
	});

	t.is(proxy.nested.data.buffer.byteLength, 32);
	t.is(callCount, 0);
});

test('ArrayBuffer should be returned as-is, not proxied', t => {
	const buffer = new ArrayBuffer(8);
	const object = {buffer};

	const proxy = onChange(object, () => {});

	t.is(proxy.buffer, buffer);
});

test('Replacing ArrayBuffer should trigger onChange', t => {
	const buffer1 = new ArrayBuffer(8);
	const buffer2 = new ArrayBuffer(16);
	const object = {buffer: buffer1};

	let callCount = 0;
	const proxy = onChange(object, () => {
		callCount++;
	});

	proxy.buffer = buffer2;
	t.is(callCount, 1);
	t.is(proxy.buffer.byteLength, 16);
});

test('TypedArray views should still be proxied', t => {
	const uint8 = new Uint8Array([1, 2, 3]);
	const object = {view: uint8};

	let callCount = 0;
	const proxy = onChange(object, () => {
		callCount++;
	});

	t.is(proxy.view.length, 3);
	t.is(proxy.view.byteLength, 3);

	proxy.view[0] = 99;
	t.is(callCount, 1);
});

test('ArrayBuffer from TypedArray.buffer should work', t => {
	const uint8 = new Uint8Array(16);
	const object = {view: uint8};

	const proxy = onChange(object, () => {});

	t.is(proxy.view.buffer.byteLength, 16);
});
