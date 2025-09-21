import test from 'ava';
import onChange from '../index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';
import {dates} from './helpers/data-types.js';

setOnChange(onChange);

test('dates', t => {
	const object = {
		a: 0,
	};
	const date = dates[0];

	testRunner(t, object, {}, (proxy, verify) => {
		proxy.a = date;
		t.true(proxy.a instanceof Date);
		verify(1, proxy, 'a', date, 0);

		let clone = new Date(date);
		proxy.a.setSeconds(32);
		verify(2, proxy, 'a', date, clone, {
			name: 'setSeconds',
			args: [32],
			result: date.valueOf(),
		});

		clone = new Date(date);
		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, {
			name: 'setHours',
			args: [5],
			result: date.valueOf(),
		});

		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, {
			name: 'setHours',
			args: [5],
			result: date.valueOf(),
		});
	});
});

test('should handle changes to dates within apply trap', t => {
	const object = [{a: new Date('1/1/2001')}];

	testRunner(t, object, {}, (proxy, verify) => {
		const clone = new Date(object[0].a);

		const forEachCallback = item => {
			item.a.setSeconds(32);
		};

		proxy.forEach(forEachCallback); // eslint-disable-line unicorn/no-array-callback-reference, unicorn/no-array-for-each

		verify(1, proxy, '', object, [{a: clone}], {
			name: 'forEach',
			args: [forEachCallback],
			result: undefined,
		});
	});
});

test('Date methods should work when details is true - issue #99', t => {
	const object = {
		date: new Date('2024-01-15T10:30:00Z'),
		nested: {
			date: new Date('2024-02-20T15:45:00Z'),
		},
	};

	let changeCount = 0;
	const proxy = onChange(object, () => {
		changeCount++;
	}, {details: true});

	// Test getter methods - these should work
	t.is(proxy.date.getFullYear(), 2024);
	t.is(proxy.date.getMonth(), 0); // January is 0
	t.is(proxy.date.getDate(), 15);
	// Use UTC methods to avoid timezone issues
	t.is(proxy.date.getUTCHours(), 10);
	t.is(proxy.date.getUTCMinutes(), 30);
	t.is(proxy.date.getUTCSeconds(), 0);
	t.is(proxy.date.getTime(), new Date('2024-01-15T10:30:00Z').getTime());

	// Test nested date
	t.is(proxy.nested.date.getFullYear(), 2024);
	t.is(proxy.nested.date.getMonth(), 1); // February is 1

	// Test setter methods - these should trigger changes
	proxy.date.setFullYear(2025);
	t.is(proxy.date.getFullYear(), 2025);
	t.is(changeCount, 1, 'Should trigger change on setFullYear');

	proxy.date.setMonth(5); // June
	t.is(proxy.date.getMonth(), 5);
	t.is(changeCount, 2, 'Should trigger change on setMonth');

	// Test conversion methods
	const isoString = proxy.date.toISOString();
	t.truthy(isoString);
	t.is(typeof isoString, 'string');

	const jsonString = proxy.date.toJSON();
	t.truthy(jsonString);
	t.is(typeof jsonString, 'string');
});

test('Date methods should work when details is false', t => {
	const object = {
		date: new Date('2024-01-15T10:30:00Z'),
	};

	const proxy = onChange(object, () => {}, {details: false});

	// Should work without issues
	t.is(proxy.date.getFullYear(), 2024);
	t.is(proxy.date.getMonth(), 0);
	proxy.date.setFullYear(2025);
	t.is(proxy.date.getFullYear(), 2025);
});

test('Date methods should work with details array including Date methods', t => {
	const object = {
		date: new Date('2024-01-15T10:30:00Z'),
	};

	let lastApplyData;
	const proxy = onChange(object, (path, value, previousValue, applyData) => {
		lastApplyData = applyData;
	}, {details: ['setFullYear', 'setMonth']});

	// These should work and provide details
	proxy.date.setFullYear(2025);
	t.is(proxy.date.getFullYear(), 2025);
	t.truthy(lastApplyData);
	t.is(lastApplyData?.name, 'setFullYear');

	lastApplyData = undefined;
	proxy.date.setMonth(5);
	t.is(proxy.date.getMonth(), 5);
	t.truthy(lastApplyData);
	t.is(lastApplyData?.name, 'setMonth');

	// This should work but not provide details
	lastApplyData = undefined;
	proxy.date.setDate(20);
	t.is(proxy.date.getDate(), 20);
	// When method is not in details array, applyData should be undefined
	t.is(lastApplyData, undefined);
});
