'use strict';

const isDiffCertain = require('../diff/is-diff-certain.js');
const isDiffArrays = require('../diff/is-diff-arrays.js');
const {IMMUTABLE_OBJECT_METHODS} = require('./object.js');

const IMMUTABLE_ARRAY_METHODS = new Set([
	'concat',
	'includes',
	'indexOf',
	'join',
	'keys',
	'lastIndexOf'
]);

const MUTABLE_ARRAY_METHODS = {
	push: isDiffCertain,
	pop: isDiffCertain,
	shift: isDiffCertain,
	unshift: isDiffCertain,
	copyWithin: isDiffArrays,
	reverse: isDiffArrays,
	sort: isDiffArrays,
	splice: isDiffArrays,
	flat: isDiffArrays,
	fill: isDiffArrays
};

const HANDLED_ARRAY_METHODS = new Set([...IMMUTABLE_OBJECT_METHODS]
	.concat([...IMMUTABLE_ARRAY_METHODS])
	.concat(Object.keys(MUTABLE_ARRAY_METHODS)));

module.exports = {MUTABLE_ARRAY_METHODS, HANDLED_ARRAY_METHODS};
