'use strict';

const isPrimitive = value => typeof value === 'object' ? value === null : typeof value !== 'function';

const isBuiltin = {
	withMutableMethods: value => {
		if (isPrimitive(value)) {
			return false;
		}

		return value instanceof Date ||
			value instanceof Set ||
			value instanceof Map ||
			value instanceof WeakSet ||
			value instanceof WeakMap;
	},
	withoutMutableMethods: value => isPrimitive(value) || value instanceof RegExp
};

module.exports = isBuiltin;
