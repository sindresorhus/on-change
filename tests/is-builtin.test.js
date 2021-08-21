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
	testValues,
	sets,
	maps,
	weakSets,
	weakMaps,
	typedArrays
} = require('./helpers/data-types');

const withoutMutableMethods = nots.concat(booleans, numbers, strings, regExps);
const singleCollections = [sets[0], maps[0], weakSets[0], weakMaps[0]];

withoutMutableMethods.forEach(value => {
	test(`.withoutMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltin.withoutMutableMethods(value));
	});
});

difference(testValues, withoutMutableMethods.concat(singleCollections)).forEach(value => {
	test(`.withoutMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltin.withoutMutableMethods(value));
	});
});

const withMutableMethods = dates.concat(singleCollections, typedArrays);

withMutableMethods.forEach(value => {
	test(`withMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltin.withMutableMethods(value));
	});
});

difference(testValues, dates.concat(sets, maps, weakSets, weakMaps, typedArrays)).forEach(value => {
	test(`withMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltin.withMutableMethods(value));
	});
});
