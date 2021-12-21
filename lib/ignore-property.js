import isSymbol from './is-symbol.js';

export default function ignoreProperty(cache, options, property) {
	return cache.isUnsubscribed
		|| (options.ignoreSymbols && isSymbol(property))
		|| (options.ignoreUnderscores && property.charAt(0) === '_')
		|| ('ignoreKeys' in options && options.ignoreKeys.includes(property));
}
