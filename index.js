'use strict';

module.exports = (object, onChange) => {
	let isBlocked = false;
	let interceptedFunctionName = null;

	const handler = {
		get(target, property, receiver) {
			const descriptors = Reflect.getOwnPropertyDescriptor(target, property);
			const value = Reflect.get(target, property, receiver);

			// Preserve invariants
			if (descriptors && descriptors.configurable === false) {
				if (descriptors.writable === false) {
					return value;
				}
			}

			if (typeof value === 'function' && interceptedFunctionName === null) {
				interceptedFunctionName = property;
			}

			try {
				return new Proxy(value, handler);
			} catch (_) {
				return value;
			}
		},
		defineProperty(target, property, descriptor) {
			const result = Reflect.defineProperty(target, property, descriptor);

			if (!isBlocked) {
				onChange();
			}

			return result;
		},
		deleteProperty(target, property) {
			const result = Reflect.deleteProperty(target, property);

			if (!isBlocked) {
				onChange();
			}

			return result;
		},
		apply(target, thisArg, argumentsList) {
			const functionName = target.name;
			if (interceptedFunctionName === functionName) {
				isBlocked = true;
				const result = Reflect.apply(target, thisArg, argumentsList);
				onChange();
				isBlocked = false;
				interceptedFunctionName = null;
				return result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	return new Proxy(object, handler);
};
