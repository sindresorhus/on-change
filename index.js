'use strict';

function isPrimitive(value) {
	return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

const proxyTarget = Symbol('ProxyTarget');

module.exports = (object, onChange) => {
	let inApply = false;
	let changed = false;
	const propCache = new WeakMap();

	function handleChange() {
		if (!inApply) {
			onChange();
		} else if (!changed) {
			changed = true;
		}
	}

	function getOwnPropertyDescriptor(target, property) {
		if (!propCache.has(target)) {
			propCache.set(target, new Map());
		}
		const props = propCache.get(target);
		if (props.has(property)) {
			return props.get(property);
		}
		const prop = Reflect.getOwnPropertyDescriptor(target, property);
		props.set(property, prop);
		return prop;
	}

	function invalidateCachedDescriptor(target, property) {
		if (!propCache.has(target)) {
			return;
		}
		const props = propCache.get(target);
		props.delete(property);
	}

	const handler = {
		get(target, property, receiver) {
			if (property === proxyTarget) {
				return target;
			}

			const value = Reflect.get(target, property, receiver);
			if (isPrimitive(value)) {
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

			return new Proxy(value, handler);
		},
		set(target, property, value, receiver) {
			if (value && value[proxyTarget] !== undefined) {
				value = value[proxyTarget];
			}
			const previous = Reflect.get(target, property, value, receiver);
			const result = Reflect.set(target, property, value);

			if (previous !== value) {
				handleChange();
			}

			return result;
		},
		defineProperty(target, property, descriptor) {
			const result = Reflect.defineProperty(target, property, descriptor);
			invalidateCachedDescriptor(target, property);

			handleChange();

			return result;
		},
		deleteProperty(target, property) {
			const result = Reflect.deleteProperty(target, property);
			invalidateCachedDescriptor(target, property);

			handleChange();

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

	return new Proxy(object, handler);
};
