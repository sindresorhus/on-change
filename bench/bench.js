/* globals suite set bench before */
'use strict';
const onChange = require('..');

const save = () => {};

suite('on-change', () => {
	set('mintime', 5000);

	let val = 0;

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
		this.object.b = val++;
		this.object.c = val++;
		this.object.d = val++;
	});

	bench('array write', () => {
		this.array[0] = val++;
		this.array[1] = val++;
		this.array[2] = val++;
		this.array[3] = val++;
	});
});

suite('on-change shallow', () => {
	set('mintime', 5000);

	let val = 0;

	before(() => {
		this.object = onChange({
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			subObj: {a: 0}
		}, save, true);
		this.array = onChange([0, 0, 0, 0], save, true);
	});

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
		this.object.b = val++;
		this.object.c = val++;
		this.object.d = val++;
	});

	bench('array write', () => {
		this.array[0] = val++;
		this.array[1] = val++;
		this.array[2] = val++;
		this.array[3] = val++;
	});
});

suite('native', () => {
	set('mintime', 5000);

	let val = 0;

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
		save();
		this.object.b = val++;
		save();
		this.object.c = val++;
		save();
		this.object.d = val++;
		save();
	});

	bench('array write', () => {
		this.array[0] = val++;
		save();
		this.array[1] = val++;
		save();
		this.array[2] = val++;
		save();
		this.array[3] = val++;
		save();
	});
});
