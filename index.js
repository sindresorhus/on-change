'use strict';

const PATH_SEPARATOR = '.';

const isPrimitive = value => value === null || (typeof value !== 'object' && typeof value !== 'function');

const isBuiltinWithoutMutableMethods = value => value instanceof RegExp || value instanceof Number;

const isBuiltinWithMutableMethods = value => value instanceof Date;

const concatPath = (path, property) => {
	if (property && property.toString) {
		if (path) {
			path += PATH_SEPARATOR;
		}

		path += property.toString();
	}

	return path;
};

const walkPath = (path, callback) => {
	let index;

	while (path) {
		index = path.indexOf(PATH_SEPARATOR);

		if (index === -1) {
			index = path.length;
		}

		callback(path.slice(0, index));

		path = path.slice(index + 1);
	}
};

const shallowClone = value => {
	if (Array.isArray(value)) {
		return value.slice();
	}

	return Object.assign({}, value);
};

const proxyTarget = Symbol('ProxyTarget');

const onChange = (object, onChange, options = {}) => {
	let inApply = false;
	let changed = false;
	let applyPath;
	let applyPrevious;
	const propCache = new WeakMap();
	const pathCache = new WeakMap();
	const proxyCache = new WeakMap();

	const handleChange = (path, property, previous, value) => {
		if (!inApply) {
			onChange(concatPath(path, property), value, previous);
			return;
		}

		if (inApply && previous !== undefined && value !== undefined && property !== 'length') {
			let item = applyPrevious;

			if (path !== applyPath) {
				path = path.replace(applyPath, '').slice(1);

				walkPath(path, key => {
					item[key] = shallowClone(item[key]);
					item = item[key];
				});
			}

			item[property] = previous;
		}

		changed = true;
	};

	const getOwnPropertyDescriptor = (target, property) => {
		let props = propCache.get(target);

		if (props) {
			return props;
		}

		props = new Map();
		propCache.set(target, props);

		let prop = props.get(property);
		if (!prop) {
			prop = Reflect.getOwnPropertyDescriptor(target, property);
			props.set(property, prop);
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
			if (
				isPrimitive(value) ||
				isBuiltinWithoutMutableMethods(value) ||
				property === 'constructor' ||
				options.isShallow === true
			) {
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
			let proxy = proxyCache.get(value);
			if (proxy === undefined) {
				proxy = new Proxy(value, handler);
				proxyCache.set(value, proxy);
			}

			return proxy;
		},

		set(target, property, value, receiver) {
			if (value && value[proxyTarget] !== undefined) {
				value = value[proxyTarget];
			}

			const previous = Reflect.get(target, property, receiver);
			const result = Reflect.set(target[proxyTarget] || target, property, value);

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
			const compare = isBuiltinWithMutableMethods(thisArg);

			if (compare) {
				thisArg = thisArg[proxyTarget];
			}

			if (!inApply) {
				inApply = true;

				if (compare) {
					applyPrevious = thisArg.valueOf();
				}

				if (Array.isArray(thisArg)) {
					applyPrevious = shallowClone(thisArg[proxyTarget]);
				}

				applyPath = pathCache.get(target);
				const firstPathPart = applyPath.lastIndexOf(PATH_SEPARATOR);
				if (firstPathPart !== -1) {
					applyPath = applyPath.slice(0, firstPathPart);
				}

				const result = Reflect.apply(target, thisArg, argumentsList);

				inApply = false;

				if (changed || (compare && applyPrevious !== thisArg.valueOf())) {
					handleChange(applyPath, '', applyPrevious, thisArg);
					applyPrevious = null;
					changed = false;
				}

				return result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	pathCache.set(object, '');
	const proxy = new Proxy(object, handler);
	onChange = onChange.bind(proxy);

	return proxy;
};

module.exports = onChange;
// TODO: Remove this for the next major release
module.exports.default = onChange;
