/* globals suite set bench */
'use strict';
const onChange = require('..');

const save = object => {
	let i = object.a;
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
		}, () => save(foo));

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
		save(foo);
		foo.b = 2;
		save(foo);
		foo.c = 3;
		save(foo);
		foo.d = 4;
		save(foo);
	});
});
