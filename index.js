'use strict';

const {TARGET, UNSUBSCRIBE} = require('./lib/constants');
const isBuiltin = require('./lib/is-builtin');
const path = require('./lib/path');
const isArray = require('./lib/is-array');
const isSymbol = require('./lib/is-symbol');
const SmartClone = require('./lib/smart-clone');

const isSameDescriptor = (a, b) => {
	return a !== undefined && b !== undefined &&
		Object.is(a.value, b.value) &&
		(a.writable || false) === (b.writable || false) &&
		(a.enumerable || false) === (b.enumerable || false) &&
		(a.configurable || false) === (b.configurable || false);
};

const onChange = (object, onChange, options = {}) => {
	const proxyTarget = Symbol('ProxyTarget');
	let isUnsubscribed = false;
	const equals = options.equals || Object.is;
	let propCache = new WeakMap();
	let pathCache = new WeakMap();
	let proxyCache = new WeakMap();
	const smartClone = new SmartClone();

	const handleChangeOnTarget = (target, property, previous, value) => {
		if (!(isUnsubscribed || (options.ignoreSymbols === true && isSymbol(property)))) {
			handleChange(pathCache.get(target), property, previous, value);
		}
	};

	const handleChange = (changePath, property, previous, value) => {
		if (smartClone.isCloning) {
			smartClone.update(changePath, property, previous);
		} else {
			onChange(path.concat(changePath, property), value, previous);
		}
	};

	const getOwnPropertyDescriptor = (target, property) => {
		let props = propCache !== null && propCache.get(target);

		if (props) {
			props = props.get(property);
		}

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
		const props = propCache ? propCache.get(target) : undefined;

		if (props) {
			props.delete(property);
		}
	};

	const buildProxy = (value, path) => {
		if (isUnsubscribed) {
			return value;
		}

		pathCache.set(value, path);

		let proxy = proxyCache.get(value);

		if (proxy === undefined) {
			proxy = new Proxy(value, handler);
			proxyCache.set(value, proxy);
		}

		return proxy;
	};

	const unsubscribe = target => {
		isUnsubscribed = true;
		propCache = null;
		pathCache = null;
		proxyCache = null;

		return target;
	};

	const ignoreProperty = property => {
		return isUnsubscribed ||
			(options.ignoreSymbols === true && isSymbol(property)) ||
			(options.ignoreUnderscores === true && property.charAt(0) === '_') ||
			(options.ignoreKeys !== undefined && options.ignoreKeys.includes(property));
	};

	const handler = {
		get(target, property, receiver) {
			if (property === proxyTarget || property === TARGET) {
				return target;
			}

			if (property === UNSUBSCRIBE &&
				pathCache !== null &&
				pathCache.get(target) === '') {
				return unsubscribe(target);
			}

			const value = Reflect.get(target, property, receiver);
			if (
				isBuiltin.withoutMutableMethods(value) ||
				property === 'constructor' ||
				options.isShallow === true ||
				ignoreProperty(property)
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

			return buildProxy(value, path.concat(pathCache.get(target), property));
		},

		set(target, property, value, receiver) {
			if (value && value[proxyTarget] !== undefined) {
				value = value[proxyTarget];
			}

			const ignore = ignoreProperty(property);
			const previous = ignore ? null : Reflect.get(target, property, receiver);
			const isChanged = !(property in target) || !equals(previous, value);
			let result = true;

			if (isChanged) {
				result = Reflect.set(target[proxyTarget] || target, property, value);

				if (!ignore && result) {
					handleChangeOnTarget(target, property, previous, value);
				}
			}

			return result;
		},

		defineProperty(target, property, descriptor) {
			let result = true;

			if (!isSameDescriptor(descriptor, getOwnPropertyDescriptor(target, property))) {
				result = Reflect.defineProperty(target, property, descriptor);

				if (result && !ignoreProperty(property) && !isSameDescriptor()) {
					invalidateCachedDescriptor(target, property);

					handleChangeOnTarget(target, property, undefined, descriptor.value);
				}
			}

			return result;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property)) {
				return true;
			}

			const ignore = ignoreProperty(property);
			const previous = ignore ? null : Reflect.get(target, property);
			const result = Reflect.deleteProperty(target, property);

			if (!ignore && result) {
				invalidateCachedDescriptor(target, property);

				handleChangeOnTarget(target, property, previous);
			}

			return result;
		},

		apply(target, thisArg, argumentsList) {
			const isMutable = isBuiltin.withMutableMethods(thisArg);

			if (isMutable) {
				thisArg = thisArg[proxyTarget];
			}

			if (smartClone.isCloning || isUnsubscribed) {
				return Reflect.apply(target, thisArg, argumentsList);
			}

			const applyPath = path.initial(pathCache.get(target));

			if (
				isMutable ||
				isArray(thisArg) ||
				toString.call(thisArg) === '[object Object]'
			) {
				smartClone.start(thisArg[proxyTarget] || thisArg, applyPath);
			}

			const result = Reflect.apply(target, thisArg, argumentsList);

			if (smartClone.isChanged(isMutable, thisArg, equals)) {
				smartClone.isCloning = false;
				handleChange(applyPath, '', smartClone.clone, thisArg[proxyTarget] || thisArg);
			}

			smartClone.done();

			return result;
		}
	};

	const proxy = buildProxy(object, options.pathAsArray === true ? [] : '');
	onChange = onChange.bind(proxy);

	return proxy;
};

onChange.target = proxy => proxy[TARGET] || proxy;
onChange.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

module.exports = onChange;
