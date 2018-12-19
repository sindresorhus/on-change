'use strict';

module.exports = (object, onChange) => {
	let inApply = false;
	let changed = false;

	function handleChange() {
		if (!inApply) {
			onChange();
		} else if (!changed) {
			changed = true;
		}
	}

	const handler = {
		get(target, property, receiver) {
			const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
			const value = Reflect.get(target, property, receiver);

			// Preserve invariants
			if (descriptor && !descriptor.configurable) {
				if (descriptor.set && !descriptor.get) {
					return undefined;
				}
				if (descriptor.writable === false) {
					return value;
				}
			}
			if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
				return new Proxy(value, handler);
			}
			return value;
		},
		set(target, property, value) {
			const result = Reflect.set(target, property, value);

			handleChange();

			return result;
		},
		defineProperty(target, property, descriptor) {
			const result = Reflect.defineProperty(target, property, descriptor);

			handleChange();

			return result;
		},
		deleteProperty(target, property) {
			const result = Reflect.deleteProperty(target, property);

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
