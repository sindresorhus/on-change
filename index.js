'use strict';

const {TARGET, UNSUBSCRIBE} = require('./lib/constants');
const isBuiltin = require('./lib/is-builtin');
const path = require('./lib/path');
const isSymbol = require('./lib/is-symbol');
const ignoreProperty = require('./lib/ignore-property');
const Cache = require('./lib/cache');
const SmartClone = require('./lib/smart-clone');

const defaultOptions = {
	equals: Object.is,
	isShallow: false,
	pathAsArray: false,
	ignoreSymbols: false,
	ignoreUnderscores: false,
	ignoreDetached: false
};

const onChange = (object, onChange, options = {}) => {
	options = {
		...defaultOptions,
		...options
	};
	const proxyTarget = Symbol('ProxyTarget');
	const {equals, isShallow, ignoreDetached} = options;
	const cache = new Cache(equals);
	const smartClone = new SmartClone();

	const handleChangeOnTarget = (target, property, previous, value) => {
		if (
			!ignoreProperty(cache, options, property) &&
			!(ignoreDetached && cache.isDetached(target, object))
		) {
			handleChange(cache.getPath(target), property, previous, value);
		}
	};

	// eslint-disable-next-line max-params
	const handleChange = (changePath, property, previous, value, name) => {
		if (smartClone.isCloning) {
			smartClone.update(changePath, property, previous);
		} else {
			onChange(path.concat(changePath, property), value, previous, name);
		}
	};

	const handler = {
		get(target, property, receiver) {
			if (isSymbol(property)) {
				if (property === proxyTarget || property === TARGET) {
					return target;
				}

				if (
					property === UNSUBSCRIBE &&
					!cache.isUnsubscribed &&
					cache.getPath(target).length === 0
				) {
					cache.unsubscribe();
					return target;
				}
			}

			const value = isBuiltin.withMutableMethods(target) ?
				Reflect.get(target, property) :
				Reflect.get(target, property, receiver);

			if (
				isBuiltin.withoutMutableMethods(value) ||
				property === 'constructor' ||
				(isShallow && !SmartClone.isHandledMethod(target, property)) ||
				ignoreProperty(cache, options, property) ||
				cache.isGetInvariant(target, property) ||
				(ignoreDetached && cache.isDetached(target, object))
			) {
				return value;
			}

			return cache.getProxy(value, path.concat(cache.getPath(target), property), handler);
		},

		set(target, property, value, receiver) {
			if (value) {
				const valueProxyTarget = value[proxyTarget];

				if (valueProxyTarget !== undefined) {
					value = valueProxyTarget;
				}
			}

			const reflectTarget = target[proxyTarget] || target;
			const previous = reflectTarget[property];
			const hasProperty = property in target;

			if (cache.setProperty(reflectTarget, property, value, receiver, previous)) {
				if (!equals(previous, value) || !hasProperty) {
					handleChangeOnTarget(target, property, previous, value);
				}

				return true;
			}

			return false;
		},

		defineProperty(target, property, descriptor) {
			if (!cache.isSameDescriptor(descriptor, target, property)) {
				if (!cache.defineProperty(target, property, descriptor)) {
					return false;
				}

				handleChangeOnTarget(target, property, undefined, descriptor.value);
			}

			return true;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property)) {
				return true;
			}

			const previous = Reflect.get(target, property);

			if (cache.deleteProperty(target, property, previous)) {
				handleChangeOnTarget(target, property, previous);

				return true;
			}

			return false;
		},

		apply(target, thisArg, argumentsList) {
			const thisProxyTarget = thisArg[proxyTarget] || thisArg;

			if (cache.isUnsubscribed) {
				return Reflect.apply(target, thisProxyTarget, argumentsList);
			}

			if (SmartClone.isHandledType(thisProxyTarget)) {
				const applyPath = path.initial(cache.getPath(target));

				smartClone.start(thisProxyTarget, applyPath, argumentsList);

				const result = Reflect.apply(
					target,
					smartClone.preferredThisArg(target, thisArg, thisProxyTarget),
					argumentsList
				);

				const isChanged = smartClone.isChanged(thisProxyTarget, equals, argumentsList);
				const clone = smartClone.stop();

				if (isChanged) {
					if (smartClone.isCloning) {
						handleChange(path.initial(applyPath), path.last(applyPath), clone, thisProxyTarget, target.name);
					} else {
						handleChange(applyPath, '', clone, thisProxyTarget, target.name);
					}
				}

				return (SmartClone.isHandledType(result) && SmartClone.isHandledMethod(thisProxyTarget, target.name)) ?
					cache.getProxy(result, applyPath, handler) :
					result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
	onChange = onChange.bind(proxy);

	return proxy;
};

onChange.target = proxy => proxy[TARGET] || proxy;
onChange.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

module.exports = onChange;
