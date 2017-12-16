"use strict";

const onChange = require("..");

let i = 0;
const save = object => {
	console.log("Object changed:", ++i);
};

suite("onChange", () => {
	set("mintime", 1000);

	bench("onChange", () => {
		let foo = onChange({ a: 0, b: 0 }, () => save(foo));
		foo.a = 1;
		foo.b = 2;
	});

	bench("save", () => {
		let foo = {
			a: 0,
			b: 0
		};

		foo.a = 1;
		save(foo);
		foo.b = 2;
		save(foo);
	});
});
