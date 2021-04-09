'use strict';

const isDiffSets = require('../diff/is-diff-sets.js');

const COLLECTION_ITERATOR_METHODS = [
	'keys',
	'values',
	'entries'
];

const IMMUTABLE_SET_METHODS = new Set([
	'has',
	'toString'
]);

const MUTABLE_SET_METHODS = {
	add: isDiffSets,
	clear: isDiffSets,
	delete: isDiffSets,
	forEach: isDiffSets
};

const HANDLED_SET_METHODS = new Set([...IMMUTABLE_SET_METHODS]
	.concat(Object.keys(MUTABLE_SET_METHODS))
	.concat(COLLECTION_ITERATOR_METHODS));

module.exports = {
	IMMUTABLE_SET_METHODS,
	MUTABLE_SET_METHODS,
	HANDLED_SET_METHODS,
	COLLECTION_ITERATOR_METHODS
};
