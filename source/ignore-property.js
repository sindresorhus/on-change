import isSymbol from './is-symbol.js';

export default function ignoreProperty(cache, options, property) {
	if (cache.isUnsubscribed) {
		return true;
	}

	if (options.ignoreSymbols && isSymbol(property)) {
		return true;
	}

	// Only strings can be prefixed with "_"
	if (options.ignoreUnderscores && typeof property === 'string' && property.charAt(0) === '_') {
		return true;
	}

	const keys = options.ignoreKeys;
	if (keys) {
		return Array.isArray(keys) ? keys.includes(property) : (keys instanceof Set ? keys.has(property) : false);
	}

	return false;
}
