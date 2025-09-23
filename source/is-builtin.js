export function isBuiltinWithMutableMethods(value) {
	return value instanceof Date
		|| value instanceof Set
		|| value instanceof Map
		|| value instanceof WeakSet
		|| value instanceof WeakMap
		|| ArrayBuffer.isView(value);
}

export function isBuiltinWithoutMutableMethods(value) {
	// Primitives and null → true. Functions → false. RegExp → true.
	return value === null
		|| (typeof value !== 'object' && typeof value !== 'function')
		|| value instanceof RegExp;
}
