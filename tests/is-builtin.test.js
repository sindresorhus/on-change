const isBuiltin = require('../lib/is-builtin');
const displayValue = require('display-value');
const test = require('ava');
const {
	difference,
	booleans,
	numbers,
	regExps,
	strings,
	dates,
	nots,
	testValues
} = require('./helpers/data-types');

const withoutMutableMethods = nots.concat(booleans, numbers, strings, regExps);

withoutMutableMethods.forEach(value => {
	test(`.withoutMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltin.withoutMutableMethods(value));
	});
});

difference(testValues, withoutMutableMethods).forEach(value => {
	test(`.withoutMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltin.withoutMutableMethods(value));
	});
});

dates.forEach(value => {
	test(`withMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltin.withMutableMethods(value));
	});
});

difference(testValues, dates).forEach(value => {
	test(`withMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltin.withMutableMethods(value));
	});
});
