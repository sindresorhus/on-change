'use strict';

module.exports = {
	withMutableMethods: value => value instanceof Date,
	withoutMutableMethods: value =>
		value === null ||
		(typeof value !== 'object' && typeof value !== 'function') ||
		value instanceof RegExp
};
