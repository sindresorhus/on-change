import isDiffSets from '../diff/is-diff-sets.js';

export const COLLECTION_ITERATOR_METHODS = [
	'keys',
	'values',
	'entries',
];

export const IMMUTABLE_SET_METHODS = new Set([
	'has',
	'toString',
]);

export const MUTABLE_SET_METHODS = {
	add: isDiffSets,
	clear: isDiffSets,
	delete: isDiffSets,
	forEach: isDiffSets,
};

export const HANDLED_SET_METHODS = new Set([
	...IMMUTABLE_SET_METHODS,
	...Object.keys(MUTABLE_SET_METHODS),
	...COLLECTION_ITERATOR_METHODS,
]);
