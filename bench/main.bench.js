/* globals suite benchmark */
'use strict';

const {benchSettings} = require('karma-webpack-bundle');
const onChange = require('..');

let temporaryTarget;
const callback = function () {};
let array;
let object;

const commonBench = before => {
	let value = 0;

	const settings = {
		...benchSettings,
		onStart: before,
		onCycle: before
	};

	benchmark('read object', () => {
		temporaryTarget = object.a;
	}, settings);

	benchmark('read object nested', () => {
		temporaryTarget = object.subObj.a;
	}, settings);

	benchmark('read array', () => {
		temporaryTarget = array[0];
	}, settings);

	benchmark('read array nested', () => {
		temporaryTarget = array[0].a;
	}, settings);

	benchmark('write object', () => {
		object.a = value++;
	}, settings);

	benchmark('write object nested', () => {
		object.subObj.a = value++;
	}, settings);

	benchmark('write array', () => {
		array[0] = value++;
	}, settings);

	benchmark('write array nested', () => {
		array[0].a = value++;
	}, settings);

	benchmark('array write in apply', () => {
		array.some((value, index) => {
			temporaryTarget = array[index];
			return true;
		});
	}, settings);

	benchmark('array push + pop', () => {
		array.push(0);
		array.pop();
	}, settings);

	benchmark('array unshift + shift', () => {
		array.unshift(0);
		array.shift();
	}, settings);
};

const buildArray = length => new Array(length)
	.fill(0)
	.map((value, index) => {
		return {
			a: index
		};
	});

const buildObject = length => {
	let prop;
	const object = {
		subObj: {a: 0}
	};

	for (let index = 0; index < length; index++) {
		prop = String.fromCharCode((index % 26) + 97);
		object[prop.repeat(Math.ceil((index + 1) / 26))] = 0;
	}

	return object;
};

const SMALL = 10;
const LARGE = 100000;

suite('on-change init', () => {
	array = buildArray(SMALL);
	object = buildObject(SMALL);

	benchmark('new Proxy', () => {
		temporaryTarget = new Proxy(object, {}); // eslint-disable-line no-unused-vars
	}, benchSettings);

	benchmark('object', () => {
		onChange(object, callback);
	}, benchSettings);

	benchmark('object, pathAsArray', () => {
		onChange(object, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('object, fat-arrow', () => {
		onChange(object, () => {});
	}, benchSettings);

	benchmark('array', () => {
		onChange(array, callback);
	}, benchSettings);

	benchmark('array, pathAsArray', () => {
		onChange(array, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('array, fat-arrow', () => {
		onChange(array, () => {});
	}, benchSettings);
});

suite('on-change', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback);
		array = onChange(buildArray(SMALL), callback);
	});
});

suite('on-change, large objects', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback);
		array = onChange(buildArray(LARGE), callback);
	});
});

suite('on-change, isShallow', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback, {isShallow: true});
		array = onChange(buildArray(SMALL), callback, {isShallow: true});
	});
});

suite('on-change, isShallow, large objects', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback, {isShallow: true});
		array = onChange(buildArray(LARGE), callback, {isShallow: true});
	});
});

suite('on-change, pathAsArray', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback, {pathAsArray: true});
		array = onChange(buildArray(SMALL), callback, {pathAsArray: true});
	});
});

suite('on-change, pathAsArray, large objects', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback, {pathAsArray: true});
		array = onChange(buildArray(LARGE), callback, {pathAsArray: true});
	});
});

suite('empty Proxy', () => {
	commonBench(() => {
		object = new Proxy(buildObject(SMALL), {});
		array = new Proxy(buildArray(SMALL), {});
	});
});

suite('empty Proxy, large objects', () => {
	commonBench(() => {
		object = new Proxy(buildObject(LARGE), {});
		array = new Proxy(buildArray(LARGE), {});
	});
});

suite('native', () => {
	commonBench(() => {
		object = buildObject(SMALL);
		array = buildArray(SMALL);
	});
});

suite('native, large objects', () => {
	commonBench(() => {
		object = buildObject(LARGE);
		array = buildArray(LARGE);
	});
});
