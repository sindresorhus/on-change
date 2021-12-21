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
