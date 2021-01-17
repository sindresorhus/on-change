const onChange = require('..');
const test = require('ava');
const {testRunner, setOnChange} = require('./helpers/test-runner');
const {dates} = require('./helpers/data-types');

setOnChange(onChange);

test('should not execute for changes on a detached object if ignoreDetached is true', t => {
	const object = {
		foo: {
			z: {
				a: 1
			}
		}
	};

	testRunner(t, object, {ignoreDetached: true}, (proxy, verify, reset) => {
		proxy.foo.z.a = 2;
		verify(1, proxy, 'foo.z.a', 2, 1);

		const detached = proxy.foo;
		const detachedNested = proxy.foo.z;

		proxy.foo = {
			z: 3
		};
		verify(2, proxy, 'foo', {z: 3}, {z: {a: 2}});

		reset();

		t.not(detachedNested, detached.z);
		t.deepEqual(detachedNested, detached.z);
		detached.z = 4;
		verify(0);
	});
});

test('should not execute for changes on a detached array if ignoreDetached is true', t => {
	const object = {
		foo: [{
			z: 1
		}]
	};

	testRunner(t, object, {ignoreDetached: true}, (proxy, verify, reset) => {
		proxy.foo[0].z = 2;
		verify(1, proxy, 'foo.0.z', 2, 1);

		const detached = proxy.foo;
		const detachedNested = proxy.foo[0];

		proxy.foo = {
			z: 3
		};
		verify(2, proxy, 'foo', {z: 3}, [{z: 2}]);

		reset();

		t.not(detachedNested, detached[0]);
		t.deepEqual(detachedNested, detached[0]);

		detached[0].z = 4;
		verify(0);

		detached.forEach((value, index) => {
			detached[index].z++;
		});
		verify(0);
	});
});
