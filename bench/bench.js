/* globals suite set bench before */
'use strict';
const onChange = require('..');

const save = () => {};

const commonBench = function () {
	set('mintime', 5000);

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

	bench('array push', () => {
		this.array.push(val++);
	});

	bench('array pop', () => {
		this.array.pop() === val++; // eslint-disable-line no-unused-expressions
	});

	bench('array unshift', () => {
		this.array.unshift(val++);
	});

	bench('array shift', () => {
		this.array.shift() === val++; // eslint-disable-line no-unused-expressions
	});
};

suite('on-change', () => {
	before(() => {
		this.object = onChange({
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			subObj: {a: 0}
		}, save);

		this.array = onChange([0, 0, 0, 0], save);
	});

	commonBench.call(this);
});

suite('on-change shallow', () => {
	before(() => {
		this.object = onChange({
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			subObj: {a: 0}
		}, save, {isShallow: true});

		this.array = onChange([0, 0, 0, 0], save, {isShallow: true});
	});

	commonBench.call(this);
});

suite('native', () => {
	before(() => {
		this.object = {
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			subObj: {a: 0}
		};

		this.array = [0, 0, 0, 0];
	});

	commonBench.call(this);
});
