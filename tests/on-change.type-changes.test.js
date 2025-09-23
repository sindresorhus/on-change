import displayValue from 'display-value';
import test from 'ava';
import onChange from '../source/index.js';
import {testRunner, setOnChange} from './helpers/test-runner.js';
import {testValues} from './helpers/data-types.js';

setOnChange(onChange);

const compare = (t, a, b) => {
	a &&= onChange.target(a);

	t.is(a, b);
};

for (const [index1, value1] of testValues.entries()) {
	for (const [index2, value2] of testValues.entries()) {
		const tag = `(${index1}/${index2})`;

		if (index1 === index2) {
			test(`should NOT detect value changes when reset to ${displayValue(value1)} ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1],
				};

				testRunner(t, object, {}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(0);

					proxy.a = value2;
					verify(0);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(0);

					proxy.b[2] = value2;
					verify(0);
				});
			});
		} else {
			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)} ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1],
				};

				testRunner(t, object, {}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(1, proxy, 'a', value2, value1);

					proxy.a = value2;
					verify(1, proxy, 'a', value2, value1);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(2, proxy, 'b.2', value2, value1);

					proxy.b[2] = value2;
					verify(2, proxy, 'b.2', value2, value1);

					delete proxy.nonExistent;
					verify(2, proxy, 'b.2', value2, value1);

					delete proxy.b;
					t.is(proxy.b, undefined);
					verify(3, proxy, 'b', undefined, [1, 2, value2]);
				});
			});

			test(`should detect value changes from ${displayValue(value1)} to ${displayValue(value2)} when pathAsArray is true ${tag}`, t => {
				const object = {
					a: value1,
					b: [1, 2, value1],
				};

				testRunner(t, object, {pathAsArray: true}, (proxy, verify) => {
					proxy.a = value2;
					compare(t, proxy.a, value2);
					verify(1, proxy, ['a'], value2, value1);

					proxy.a = value2;
					verify(1, proxy, ['a'], value2, value1);

					proxy.b[2] = value2;
					compare(t, proxy.b[2], value2);
					verify(2, proxy, ['b', '2'], value2, value1);

					proxy.b[2] = value2;
					verify(2, proxy, ['b', '2'], value2, value1);

					delete proxy.nonExistent;
					verify(2, proxy, ['b', '2'], value2, value1);

					delete proxy.b;
					t.is(proxy.b, undefined);
					verify(3, proxy, ['b'], undefined, [1, 2, value2]);
				});
			});
		}
	}
}
