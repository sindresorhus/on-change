const onChange = require('..');
const test = require('ava');
const {testRunner, setOnChange} = require('./helpers/test-runner');

setOnChange(onChange);

test('should trigger multiple changes when details specifies a method', t => {
	const object = {
		a: [{b: 1}, {b: 2}, {b: 3}]
	};

	testRunner(t, object, {details: ['forEach']}, (proxy, verify) => {
		verify(0);

		proxy.a.forEach(item => {
			item.b++;
		});
		verify(3, proxy, 'a.2.b', 4, 3);

		const mapFunc = item => item.b++;

		proxy.a.map(mapFunc); // eslint-disable-line unicorn/no-fn-reference-in-iterator
		verify(4, proxy, 'a', [{b: 3}, {b: 4}, {b: 5}], [{b: 2}, {b: 3}, {b: 4}], {
			name: 'map',
			args: [mapFunc],
			result: [2, 3, 4]
		});
	});
});

test('should trigger multiple changes when details is true', t => {
	const object = {
		a: [{b: 1}, {b: 2}, {b: 3}]
	};

	testRunner(t, object, {details: true}, (proxy, verify) => {
		verify(0);

		proxy.a.forEach(item => {
			item.b++;
		});
		verify(3, proxy, 'a.2.b', 4, 3);

		proxy.a.map(item => item.b++);
		verify(6, proxy, 'a.2.b', 5, 4);
	});
});
