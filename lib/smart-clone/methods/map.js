import isDiffMaps from '../diff/is-diff-maps.js';
import {IMMUTABLE_SET_METHODS, COLLECTION_ITERATOR_METHODS} from './set.js';

const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS, 'get']);

export const MUTABLE_MAP_METHODS = {
	set: isDiffMaps,
	clear: isDiffMaps,
	delete: isDiffMaps,
	forEach: isDiffMaps,
};

export const HANDLED_MAP_METHODS = new Set([
	...IMMUTABLE_MAP_METHODS,
	...Object.keys(MUTABLE_MAP_METHODS),
	...COLLECTION_ITERATOR_METHODS,
]);
