import {expectType} from 'tsd';
import onChange from './index.js';

const object = {
	foo: false,
	a: {
		b: [
			{
				c: false,
			},
		],
	},
};

const watchedObject = onChange(object, function (path) {
	expectType<typeof object>(this);
	expectType<string>(path);
});
expectType<typeof object>(watchedObject);

watchedObject.foo = true;
watchedObject.a.b[0].c = true;

const watchedObjectShallow = onChange(object, function () {
	expectType<typeof object>(this);
}, {
	isShallow: true,
});
expectType<typeof object>(watchedObjectShallow);

watchedObject.foo = true;

const watchedObjectEquals = onChange(object, function () {
	expectType<typeof object>(this);
}, {
	equals: (a, b) => a === b,
});
expectType<typeof object>(watchedObjectEquals);

watchedObject.foo = true;

const watchedObjectPathAsArray = onChange(object, function (path) {
	expectType<typeof object>(this);
	expectType<Array<string | symbol>>(path);
}, {
	pathAsArray: true,
});
expectType<typeof object>(watchedObjectPathAsArray);
watchedObjectPathAsArray.foo = true;

const watchedObjectPathAsString = onChange(object, function (path) {
	expectType<typeof object>(this);
	expectType<string>(path);
}, {
	pathAsArray: false,
});
expectType<typeof object>(watchedObjectPathAsString);

watchedObjectPathAsString.foo = true;

const watchedObjectPathAsStringArray = onChange(object, function (path) {
	expectType<typeof object>(this);
	expectType<string[]>(path);
}, {
	ignoreSymbols: true,
	pathAsArray: true,
});
expectType<typeof object>(watchedObjectPathAsStringArray);

watchedObjectPathAsStringArray.foo = true;
