import {expectType} from 'tsd';
import onChange = require('.');

const object = {
	foo: false,
	a: {
		b: [
			{
				c: false
			}
		]
	}
};

const watchedObject = onChange(object, function () {
	expectType<typeof object>(this);
});
expectType<typeof object>(watchedObject);

watchedObject.foo = true;
watchedObject.a.b[0].c = true;

const watchedObjectShallow = onChange(object, function () {
	expectType<typeof object>(this);
}, {
	isShallow: true
});
expectType<typeof object>(watchedObjectShallow);

watchedObject.foo = true;

const watchedObjectEquals = onChange(object, function () {
	expectType<typeof object>(this);
}, {
	equals: (a, b) => a === b
});
expectType<typeof object>(watchedObjectEquals);

watchedObject.foo = true;
