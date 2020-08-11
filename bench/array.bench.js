/* globals suite benchmark */
'use strict';

const onChange = require('..');
const {benchSettings} = require('karma-webpack-bundle');

let temporaryTarget;
const callback = () => {};
let array;

const commonBench = before => {
	let value = 0;
	const settings = {
		...benchSettings,
		onStart: before,
		onCycle: before
	};

	benchmark('read', () => {
		temporaryTarget = array[3];
	}, settings);

	benchmark('read nested', () => {
		temporaryTarget = array[3].a;
	}, settings);

	benchmark('write', () => {
		array[2] = value++;
	}, settings);

	benchmark('write nested', () => {
		array[4].a = value++;
	}, settings);

	benchmark('read in apply', () => {
		array.some((value, index) => {
			temporaryTarget = array[index];
			return true;
		});
	}, settings);

	benchmark('write in apply', () => {
		array.some((value, index) => {
			array[index] = value++;
			return true;
		});
	}, settings);

	benchmark('push', () => {
		array.push(0);
	}, settings);

	benchmark('pop', () => {
		array.pop();
	}, settings);

	benchmark('unshift', () => {
		array.unshift(0);
	}, settings);

	benchmark('shift', () => {
		array.shift();
	}, settings);

	benchmark('toString', () => {
		temporaryTarget = array.toString();
	}, settings);
};

const buildArray = length => new Array(length)
	.fill(0)
	.map((value, index) => ({a: index}));

const SMALL = 10;
const LARGE = 100000;

suite('on-change init array', () => {
	array = buildArray(SMALL);

	benchmark('new Proxy', () => {
		temporaryTarget = new Proxy(array, {}); // eslint-disable-line no-unused-vars
	}, benchSettings);

	benchmark('no options', () => {
		onChange(array, callback);
	}, benchSettings);

	benchmark('pathAsArray', () => {
		onChange(array, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('fat-arrow', () => {
		onChange(array, () => {});
	}, benchSettings);
});

suite('on-change with array', () => {
	commonBench(() => {
		array = onChange(buildArray(SMALL), callback);
	});
});

suite('on-change with large array', () => {
	commonBench(() => {
		array = onChange(buildArray(LARGE), callback);
	});
});

suite('on-change with array, isShallow', () => {
	commonBench(() => {
		array = onChange(buildArray(SMALL), callback, {isShallow: true});
	});
});

suite('on-change with large array, isShallow', () => {
	commonBench(() => {
		array = onChange(buildArray(LARGE), callback, {isShallow: true});
	});
});

suite('on-change with array, pathAsArray', () => {
	commonBench(() => {
		array = onChange(buildArray(SMALL), callback, {pathAsArray: true});
	});
});

suite('on-change with large array, pathAsArray', () => {
	commonBench(() => {
		array = onChange(buildArray(LARGE), callback, {pathAsArray: true});
	});
});

suite('empty Proxy with array', () => {
	commonBench(() => {
		array = new Proxy(buildArray(SMALL), {});
	});
});

suite('empty Proxy with large array', () => {
	commonBench(() => {
		array = new Proxy(buildArray(LARGE), {});
	});
});

suite('native with array', () => {
	commonBench(() => {
		array = buildArray(SMALL);
	});
});

suite('native with large array', () => {
	commonBench(() => {
		array = buildArray(LARGE);
	});
});
