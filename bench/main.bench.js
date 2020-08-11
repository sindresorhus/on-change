/* globals suite benchmark */
'use strict';

const {benchSettings} = require('karma-webpack-bundle');
const onChange = require('..');

let temporaryTarget;
const callback = function () {};
let object;

const commonBench = before => {
	let value = 0;
	const settings = {
		...benchSettings,
		onStart: before,
		onCycle: before
	};

	benchmark('read', () => {
		temporaryTarget = object.a;
	}, settings);

	benchmark('read nested', () => {
		temporaryTarget = object.subObj.a;
	}, settings);

	benchmark('write', () => {
		object.a = value++;
	}, settings);

	benchmark('write nested', () => {
		object.subObj.a = value++;
	}, settings);

	benchmark('toString', () => {
		temporaryTarget = object.toString();
	}, settings);
};

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

suite('on-change init with object', () => {
	object = buildObject(SMALL);

	benchmark('new Proxy', () => {
		temporaryTarget = new Proxy(object, {}); // eslint-disable-line no-unused-vars
	}, benchSettings);

	benchmark('no options', () => {
		onChange(object, callback);
	}, benchSettings);

	benchmark('pathAsArray', () => {
		onChange(object, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('fat-arrow', () => {
		onChange(object, () => {});
	}, benchSettings);
});

suite('on-change with object', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback);
	});
});

suite('on-change with large object', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback);
	});
});

suite('on-change with object, isShallow', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback, {isShallow: true});
	});
});

suite('on-change with large object, isShallow', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback, {isShallow: true});
	});
});

suite('on-change with object, pathAsArray', () => {
	commonBench(() => {
		object = onChange(buildObject(SMALL), callback, {pathAsArray: true});
	});
});

suite('on-change with large object, pathAsArray', () => {
	commonBench(() => {
		object = onChange(buildObject(LARGE), callback, {pathAsArray: true});
	});
});

suite('empty Proxy with object', () => {
	commonBench(() => {
		object = new Proxy(buildObject(SMALL), {});
	});
});

suite('empty Proxy with large object', () => {
	commonBench(() => {
		object = new Proxy(buildObject(LARGE), {});
	});
});

suite('native object', () => {
	commonBench(() => {
		object = buildObject(SMALL);
	});
});

suite('native large object', () => {
	commonBench(() => {
		object = buildObject(LARGE);
	});
});
