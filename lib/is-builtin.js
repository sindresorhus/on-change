export function isBuiltinWithMutableMethods(value) {
	return value instanceof Date
		|| value instanceof Set
		|| value instanceof Map
		|| value instanceof WeakSet
		|| value instanceof WeakMap
		|| ArrayBuffer.isView(value);
}

export function isBuiltinWithoutMutableMethods(value) {
	return (typeof value === 'object' ? value === null : typeof value !== 'function') || value instanceof RegExp;
}
