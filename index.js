'use strict';

const isPrimitive = value => value === null || (typeof value !== 'object' && typeof value !== 'function');

const concatPath = (path, property) => {
	if (property && property.toString) {
		if (path) {
			path += '.';
		}
		path += property.toString();
	}
	return path;
};

const proxyTarget = Symbol('ProxyTarget');

module.exports = (object, onChange) => {
	let inApply = false;
	let changed = false;
	const propCache = new WeakMap();
	const pathCache = new WeakMap();

	const handleChange = (path, property, previous, value) => {
		if (!inApply) {
			onChange.call(proxy, concatPath(path, property), previous, value);
		} else if (!changed) {
			changed = true;
		}
	};

	const getOwnPropertyDescriptor = (target, property) => {
		let props = propCache.get(target);

		if (!props) {
			propCache.set(target, props = new Map());
		}

		let prop = props.get(property);
		if (!prop) {
			props.set(property, prop = Reflect.getOwnPropertyDescriptor(target, property));
		}

		return prop;
	};

	const invalidateCachedDescriptor = (target, property) => {
		const props = propCache.get(target);

		if (props) {
			props.delete(property);
		}
	};

	const handler = {
		get(target, property, receiver) {
			if (property === proxyTarget) {
				return target;
			}

			const value = Reflect.get(target, property, receiver);
			if (isPrimitive(value) || property === 'constructor') {
				return value;
			}

			// Preserve invariants
			const descriptor = getOwnPropertyDescriptor(target, property);
			if (descriptor && !descriptor.configurable) {
				if (descriptor.set && !descriptor.get) {
					return undefined;
				}

				if (descriptor.writable === false) {
					return value;
				}
			}

			pathCache.set(value, concatPath(pathCache.get(target), property));
			return new Proxy(value, handler);
		},

		set(target, property, value, receiver) {
			if (value && value[proxyTarget] !== undefined) {
				value = value[proxyTarget];
			}

			const previous = Reflect.get(target, property, receiver);
			const result = Reflect.set(target, property, value);

			if (previous !== value) {
				handleChange(pathCache.get(target), property, previous, value);
			}

			return result;
		},

		defineProperty(target, property, descriptor) {
			const result = Reflect.defineProperty(target, property, descriptor);
			invalidateCachedDescriptor(target, property);

			handleChange(pathCache.get(target), property, undefined, descriptor.value);

			return result;
		},

		deleteProperty(target, property) {
			const previous = Reflect.get(target, property);
			const result = Reflect.deleteProperty(target, property);
			invalidateCachedDescriptor(target, property);

			handleChange(pathCache.get(target), property, previous);

			return result;
		},

		apply(target, thisArg, argumentsList) {
			if (!inApply) {
				inApply = true;

				const result = Reflect.apply(target, thisArg, argumentsList);

				if (changed) {
					onChange();
				}

				inApply = false;
				changed = false;

				return result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	pathCache.set(object, '');
	const proxy = new Proxy(object, handler);

	return proxy;
};
