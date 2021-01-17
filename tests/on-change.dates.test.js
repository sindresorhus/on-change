const onChange = require('..');
const test = require('ava');
const {testRunner, setOnChange} = require('./helpers/test-runner');
const {dates} = require('./helpers/data-types');

setOnChange(onChange);

test('dates', t => {
	const object = {
		a: 0
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
			result: 978328832000
		});

		clone = new Date(date);
		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, {
			name: 'setHours',
			args: [5],
			result: 978346832000
		});

		proxy.a.setHours(5);
		verify(3, proxy, 'a', date, clone, {
			name: 'setHours',
			args: [5],
			result: 978346832000
		});
	});
});

test('should handle changes to dates within apply trap', t => {
	const object = [{a: new Date('1/1/2001')}];

	testRunner(t, object, {}, (proxy, verify) => {
		const clone = new Date(object[0].a);

		const forEachFunc = item => {
			item.a.setSeconds(32);
		};

		proxy.forEach(forEachFunc); // eslint-disable-line unicorn/no-fn-reference-in-iterator

		verify(1, proxy, '', object, [{a: clone}], {
			name: 'forEach',
			args: [forEachFunc],
			result: undefined
		});
	});
});
