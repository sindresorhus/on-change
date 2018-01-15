/* globals suite set bench */
'use strict';
const onChange = require('..');

const save = (object, initial = 0) => {
	let i = object[initial];
	while (i < 1000) {
		i++;
	}
};

suite('onChange', () => {
	set('mintime', 5000);

	bench('on-change', () => {
		const foo = onChange({
			a: 0,
			b: 0,
			c: 0,
			d: 0
		}, () => save(foo, 'a'));

		foo.a = 1;
		foo.b = 2;
		foo.c = 3;
		foo.d = 4;
	});

	bench('native', () => {
		const foo = {
			a: 0,
			b: 0,
			c: 0,
			d: 0
		};

		foo.a = 1;
		save(foo, 'a');
		foo.b = 2;
		save(foo, 'a');
		foo.c = 3;
		save(foo, 'a');
		foo.d = 4;
		save(foo, 'a');
	});
});

suite('bench with an array too', () => {
	set('mintime', 5000);

	bench('on-change', () => {
		const foo = onChange([0, 0, 0, 0], () => save(foo));

		foo[0] = 1;
		foo[1] = 2;
		foo[2] = 3;
		foo[3] = 4;
	});

	bench('native', () => {
		const foo = [0, 0, 0, 0];

		foo[0] = 1;
		save(foo);
		foo[1] = 2;
		save(foo);
		foo[2] = 3;
		save(foo);
		foo[3] = 4;
		save(foo);
	});
});
