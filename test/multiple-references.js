import test from 'ava';
import onChange from '../index.js';

test('multiple reference scenario', t => {
	const events = [];
	const sharedChild = {value: 1};
	const object = {
		ref1: sharedChild,
		ref2: sharedChild,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Access both references to register paths
	const [ref1] = [watchedObject.ref1, watchedObject.ref2];

	// Modify through one reference
	ref1.value = 42;

	t.is(events.length, 2);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('ref1.value'));
	t.true(paths.has('ref2.value'));
	t.is(events[0].value, 42);
	t.is(events[1].value, 42);
});

test('nested multiple references', t => {
	const events = [];
	const deepChild = {data: 'test'};
	const object = {
		branch1: {
			child: deepChild,
		},
		branch2: {
			child: deepChild,
		},
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Access both nested references
	const [child1] = [watchedObject.branch1.child, watchedObject.branch2.child];

	// Modify through one path
	child1.data = 'modified';

	t.is(events.length, 2);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('branch1.child.data'));
	t.true(paths.has('branch2.child.data'));
	t.is(events[0].value, 'modified');
	t.is(events[1].value, 'modified');
});

test('three or more references', t => {
	const events = [];
	const sharedChild = {count: 0};
	const object = {
		first: sharedChild,
		second: sharedChild,
		third: sharedChild,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Access all three references to register paths
	// eslint-disable-next-line no-unused-vars
	const _unused = [watchedObject.first, watchedObject.second, watchedObject.third];

	// Modify through one reference
	watchedObject.second.count = 10;

	t.is(events.length, 3);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('first.count'));
	t.true(paths.has('second.count'));
	t.true(paths.has('third.count'));
});

test('array with duplicate references', t => {
	const events = [];
	const item = {id: 1};
	const array = [item, item, item];

	const watchedArray = onChange(array, (path, value) => {
		events.push({path, value});
	});

	// Access all array items to register paths
	// eslint-disable-next-line no-unused-vars
	const _unused = [watchedArray[0], watchedArray[1], watchedArray[2]];

	// Modify through first index
	watchedArray[0].id = 999;

	t.is(events.length, 3);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('0.id'));
	t.true(paths.has('1.id'));
	t.true(paths.has('2.id'));
});

test('only fires for accessed paths', t => {
	const events = [];
	const sharedChild = {value: 1};
	const object = {
		accessed: sharedChild,
		notAccessed: sharedChild,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Only access one reference
	// eslint-disable-next-line no-unused-vars
	const _unused = watchedObject.accessed;

	// Modify the object
	watchedObject.accessed.value = 42;

	// Should only get one event because notAccessed was never accessed
	t.is(events.length, 1);
	t.is(events[0].path, 'accessed.value');
});

test('works with pathAsArray option', t => {
	const events = [];
	const sharedChild = {value: 1};
	const object = {
		ref1: sharedChild,
		ref2: sharedChild,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	}, {pathAsArray: true});

	// Access both references to register paths
	// eslint-disable-next-line no-unused-vars
	const _unused = [watchedObject.ref1, watchedObject.ref2];

	// Modify through one reference
	watchedObject.ref1.value = 42;

	console.log('Events with pathAsArray:', events);
	t.is(events.length, 2);
	const pathStrings = new Set(events.map(event => Array.isArray(event.path) ? event.path.join('.') : event.path));
	t.true(pathStrings.has('ref1.value'));
	t.true(pathStrings.has('ref2.value'));
});

test('deletion operations', t => {
	const events = [];
	const sharedChild = {removeme: 'test'};
	const object = {
		ref1: sharedChild,
		ref2: sharedChild,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Access both references to register paths
	// eslint-disable-next-line no-unused-vars
	const _unused = [watchedObject.ref1, watchedObject.ref2];

	// Delete property through one reference
	delete watchedObject.ref1.removeme;

	t.is(events.length, 2);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('ref1.removeme'));
	t.true(paths.has('ref2.removeme'));
	t.is(events[0].value, undefined);
	t.is(events[1].value, undefined);
});

test('circular references with multiple paths', t => {
	const events = [];
	const circular = {value: 1};
	circular.self = circular;

	const object = {
		ref1: circular,
		ref2: circular,
	};

	const watchedObject = onChange(object, (path, value) => {
		events.push({path, value});
	});

	// Access both references
	// eslint-disable-next-line no-unused-vars
	const _unused = [watchedObject.ref1, watchedObject.ref2];

	// Modify through circular reference
	watchedObject.ref1.self.value = 42;

	// Should fire for both paths despite circular reference
	t.is(events.length, 2);
	const paths = new Set(events.map(event => event.path));
	t.true(paths.has('ref1.value'));
	t.true(paths.has('ref2.value'));
});
