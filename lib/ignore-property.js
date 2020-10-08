'use strict';

const isSymbol = require('./is-symbol');

module.exports = (cache, options, property) => {
	return cache.isUnsubscribed ||
		(options.ignoreSymbols && isSymbol(property)) ||
		(options.ignoreUnderscores && property.charAt(0) === '_') ||
		('ignoreKeys' in options && options.ignoreKeys.includes(property));
};
