'use strict';

const isBuiltin = {
	withMutableMethods: value => {
		return value instanceof Date ||
			value instanceof Set ||
			value instanceof Map ||
			value instanceof WeakSet ||
			value instanceof WeakMap;
	},
	withoutMutableMethods: value => (typeof value === 'object' ? value === null : typeof value !== 'function') || value instanceof RegExp
};

module.exports = isBuiltin;
