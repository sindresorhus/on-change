import displayValue from 'display-value';
import test from 'ava';
import {isBuiltinWithMutableMethods, isBuiltinWithoutMutableMethods} from '../lib/is-builtin.js';
import {
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
	typedArrays,
} from './helpers/data-types.js';

const withoutMutableMethods = [...nots, ...booleans, ...numbers, ...strings, ...regExps];
const singleCollections = [sets[0], maps[0], weakSets[0], weakMaps[0]];

for (const value of withoutMutableMethods) {
	test(`.withoutMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltinWithoutMutableMethods(value));
	});
}

for (const value of difference(testValues, [...withoutMutableMethods, ...singleCollections])) {
	test(`.withoutMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltinWithoutMutableMethods(value));
	});
}

const withMutableMethods = [...dates, ...singleCollections, ...typedArrays];

for (const value of withMutableMethods) {
	test(`withMutableMethods should return true for ${displayValue(value)}`, t => {
		t.true(isBuiltinWithMutableMethods(value));
	});
}

for (const value of difference(testValues, [...dates, ...sets, ...maps, ...weakSets, ...weakMaps, ...typedArrays])) {
	test(`withMutableMethods should return false for ${displayValue(value)}`, t => {
		t.false(isBuiltinWithMutableMethods(value));
	});
}
