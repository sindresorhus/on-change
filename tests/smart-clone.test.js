const SmartClone = require('../lib/smart-clone');
const test = require('ava');

test('should clone an inner object only once', t => {
	const smartClone = new SmartClone();
	const array = [1, 2, {
		a: 1,
		b: 2
	}];

	t.is(smartClone.isCloning, false);

	smartClone.start(array, '');

	t.is(smartClone.isCloning, true);
	t.is(array[2], smartClone.clone[2]);
	t.deepEqual(array, smartClone.clone);

	smartClone.update('2', 'b', 3);

	t.is(smartClone.isCloning, true);
	t.is(array[2].b, 2);
	t.is(smartClone.clone[2].b, 3);
	t.not(array, smartClone.clone);
	t.not(array[2], smartClone.clone[2]);
	t.notDeepEqual(array, smartClone.clone);

	const object = smartClone.clone[2];

	smartClone.update('2', 'a', 4);

	t.is(smartClone.isCloning, true);
	t.is(array[2].a, 1);
	t.is(smartClone.clone[2].a, 4);
	t.not(array, smartClone.clone);
	t.not(array[2], smartClone.clone[2]);
	t.notDeepEqual(array, smartClone.clone);
	t.is(object, smartClone.clone[2]);

	smartClone.done();

	t.is(smartClone.isCloning, false);
});

test('should handle dates', t => {
	const smartClone = new SmartClone();
	const date = new Date('1/1/2001');

	t.is(smartClone.isCloning, false);

	smartClone.start(date.valueOf());

	t.is(smartClone.isCloning, true);
	t.is(date.valueOf(), smartClone.clone);

	smartClone.done();

	t.is(smartClone.isCloning, false);
});
