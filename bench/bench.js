/* globals suite set bench before */
'use strict';
const onChange = require('..');

const save = () => {};

const commonBench = function () {
	set('mintime', 500);

	let val = 0;

	bench('object read', () => {
		this.object.a === val++; // eslint-disable-line no-unused-expressions
	});

	bench('nested read', () => {
		this.object.subObj.a === val++; // eslint-disable-line no-unused-expressions
	});

	bench('array read', () => {
		this.array[0] === val++; // eslint-disable-line no-unused-expressions
	});

	bench('object write', () => {
		this.object.a = val++;
	});

	bench('array write', () => {
		this.array[0] = val++;
	});

	bench('array write in apply', () => {
		this.array.some((value, index) => {
			this.array[index] = val++;
			return true;
		});
	});

	bench('array push + pop', () => {
		this.array.push(val++);
		this.array.pop();
	});

	bench('array unshift + shift', () => {
		this.array.unshift(val++);
		this.array.shift();
	});
};

const buildArray = length => {
	const array = [];
	array.length = length;
	return array.fill(0);
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

suite('on-change', () => {
	before(() => {
		this.object = onChange(buildObject(SMALL), save);
		this.array = onChange(buildArray(SMALL), save);
	});

	commonBench.call(this);
});

suite('on-change, large objects', () => {
	before(() => {
		this.object = onChange(buildObject(LARGE), save);
		this.array = onChange(buildArray(LARGE), save);
	});

	commonBench.call(this);
});

suite('on-change, isShallow', () => {
	before(() => {
		this.object = onChange(buildObject(SMALL), save, {isShallow: true});
		this.array = onChange(buildArray(SMALL), save, {isShallow: true});
	});

	commonBench.call(this);
});

suite('on-change, isShallow, large objects', () => {
	before(() => {
		this.object = onChange(buildObject(LARGE), save, {isShallow: true});
		this.array = onChange(buildArray(LARGE), save, {isShallow: true});
	});

	commonBench.call(this);
});

suite('native', () => {
	before(() => {
		this.object = buildObject(SMALL);
		this.array = buildArray(SMALL);
	});

	commonBench.call(this);
});

suite('native, large objects', () => {
	before(() => {
		this.object = buildObject(LARGE);
		this.array = buildArray(LARGE);
	});

	commonBench.call(this);
});
