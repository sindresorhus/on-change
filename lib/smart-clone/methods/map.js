'use strict';

const {IMMUTABLE_SET_METHODS, COLLECTION_ITERATOR_METHODS} = require('./set.js');
const isDiffMaps = require('../diff/is-diff-maps.js');

const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS].concat(['get']));

const MUTABLE_MAP_METHODS = {
	set: isDiffMaps,
	clear: isDiffMaps,
	delete: isDiffMaps,
	forEach: isDiffMaps
};

const HANDLED_MAP_METHODS = new Set([...IMMUTABLE_MAP_METHODS]
	.concat(Object.keys(MUTABLE_MAP_METHODS))
	.concat(COLLECTION_ITERATOR_METHODS));

module.exports = {MUTABLE_MAP_METHODS, HANDLED_MAP_METHODS};
