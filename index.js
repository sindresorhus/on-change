'use strict';

const {TARGET, UNSUBSCRIBE} = require('./lib/constants');
const isBuiltin = require('./lib/is-builtin');
const path = require('./lib/path');
const isSymbol = require('./lib/is-symbol');
const isObject = require('./lib/is-object');
const ignoreProperty = require('./lib/ignore-property');
const Cache = require('./lib/cache');
const SmartClone = require('./lib/smart-clone');

const defaultOptions = {
	equals: Object.is,
	isShallow: false,
	pathAsArray: false,
	ignoreSymbols: false,
	ignoreUnderscores: false
};

const onChange = (object, onChange, options = {}) => {
	options = {
		...defaultOptions,
		...options
	};
	const proxyTarget = Symbol('ProxyTarget');
	const {equals, isShallow} = options;
	const cache = new Cache(equals);
	const smartClone = new SmartClone();

	const handleChangeOnTarget = (target, property, previous, value) => {
		if (!ignoreProperty(cache, options, property)) {
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
				(isShallow && !smartClone.isHandledMethod(target, property)) ||
				ignoreProperty(cache, options, property) ||
				cache.isGetInvariant(target, property)
			) {
				return value;
			}

			return cache.getProxy(value, path.concat(cache.getPath(target), property), handler);
		},

		set(target, property, value, receiver) {
			if (isObject(value)) {
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
			const isMutable = isBuiltin.withMutableMethods(thisArg);
			const thisProxyTarget = thisArg[proxyTarget] || thisArg;

			if (isMutable) {
				thisArg = thisProxyTarget;
			}

			if (smartClone.isCloning || cache.isUnsubscribed) {
				return Reflect.apply(target, thisProxyTarget, argumentsList);
			}

			const applyPath = path.initial(cache.getPath(target));

			if (isMutable || smartClone.isHandledType(thisProxyTarget)) {
				smartClone.start(thisProxyTarget, applyPath, argumentsList);
			}

			const result = Reflect.apply(
				target,
				smartClone.preferredThisArg(target, thisArg, thisProxyTarget),
				argumentsList
			);

			if (smartClone.isChanged(isMutable, thisProxyTarget, equals, argumentsList)) {
				const clone = smartClone.done();
				handleChange(applyPath, '', clone, thisProxyTarget, target.name);
			}

			smartClone.done();

			if (
				smartClone.isHandledType(result) &&
				smartClone.isHandledMethod(thisProxyTarget, target.name)
			) {
				return cache.getProxy(result, applyPath, handler);
			}

			return result;
		}
	};

	const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
	onChange = onChange.bind(proxy);

	return proxy;
};

onChange.target = proxy => proxy[TARGET] || proxy;
onChange.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

module.exports = onChange;
