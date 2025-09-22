/* eslint-disable unicorn/prefer-spread */
import {TARGET, UNSUBSCRIBE, PATH_SEPARATOR} from './lib/constants.js';
import {isBuiltinWithMutableMethods, isBuiltinWithoutMutableMethods} from './lib/is-builtin.js';
import path from './lib/path.js';
import isObject from './lib/is-object.js';
import isSymbol from './lib/is-symbol.js';
import isIterator from './lib/is-iterator.js';
import wrapIterator from './lib/wrap-iterator.js';
import ignoreProperty from './lib/ignore-property.js';
import Cache from './lib/cache.js';
import SmartClone from './lib/smart-clone/smart-clone.js';

const defaultOptions = {
	equals: Object.is,
	isShallow: false,
	pathAsArray: false,
	ignoreSymbols: false,
	ignoreUnderscores: false,
	ignoreDetached: false,
	details: false,
};

const onChange = (object, onChange, options = {}) => {
	options = {
		...defaultOptions,
		...options,
	};

	const proxyTarget = Symbol('ProxyTarget');
	const {equals, isShallow, ignoreDetached, details} = options;
	const cache = new Cache(equals);
	const hasOnValidate = typeof options.onValidate === 'function';
	const smartClone = new SmartClone(hasOnValidate);

	// eslint-disable-next-line max-params
	const validate = (target, property, value, previous, applyData) => !hasOnValidate
		|| smartClone.isCloning
		|| options.onValidate(path.concat(cache.getPath(target), property), value, previous, applyData) === true;

	// eslint-disable-next-line max-params
	const handleChangeOnTarget = (target, property, value, previous, applyData) => {
		if (
			ignoreProperty(cache, options, property)
			|| (ignoreDetached && cache.isDetached(target, object))
		) {
			return;
		}

		// Determine which paths to notify
		const pathsToNotify = !smartClone.isCloning
			&& cache.getAllPaths(target)?.length > 1
			? cache.getAllPaths(target)
			: [cache.getPath(target)];

		// Notify all relevant paths
		for (const changePath of pathsToNotify) {
			handleChange(changePath, property, value, previous, applyData);
		}
	};

	// eslint-disable-next-line max-params
	const handleChange = (changePath, property, value, previous, applyData) => {
		if (smartClone.isCloning && smartClone.isPartOfClone(changePath)) {
			smartClone.update(changePath, property, previous);
		} else {
			onChange(path.concat(changePath, property), value, previous, applyData);
		}
	};

	const getProxyTarget = value => value
		? (value[proxyTarget] ?? value)
		: value;

	const prepareValue = (value, target, property, basePath) => {
		if (
			isBuiltinWithoutMutableMethods(value)
			|| property === 'constructor'
			|| (isShallow && !SmartClone.isHandledMethod(target, property))
			|| ignoreProperty(cache, options, property)
			|| cache.isGetInvariant(target, property)
			|| (ignoreDetached && cache.isDetached(target, object))
		) {
			return value;
		}

		if (basePath === undefined) {
			basePath = cache.getPath(target);
		}

		/*
  		Check for circular references.

  		If the value already has a corresponding path/proxy,
		and if the path corresponds to one of the parents,
		then we are on a circular case, where the child is pointing to their parent.
		In this case we return the proxy object with the shortest path.
  		*/
		const childPath = path.concat(basePath, property);
		const existingPath = cache.getPath(value);

		if (existingPath && isSameObjectTree(childPath, existingPath)) {
			// We are on the same object tree but deeper, so we use the parent path.
			return cache.getProxy(value, existingPath, handler, proxyTarget);
		}

		return cache.getProxy(value, childPath, handler, proxyTarget);
	};

	/*
	Returns true if `childPath` is a subpath of `existingPath`
	(if childPath starts with existingPath). Otherwise, it returns false.

 	It also returns false if the 2 paths are identical.

 	For example:
	- childPath    = group.layers.0.parent.layers.0.value
	- existingPath = group.layers.0.parent
	*/
	const isSameObjectTree = (childPath, existingPath) => {
		if (isSymbol(childPath) || childPath.length <= existingPath.length) {
			return false;
		}

		if (Array.isArray(existingPath) && existingPath.length === 0) {
			return false;
		}

		const childParts = Array.isArray(childPath) ? childPath : childPath.split(PATH_SEPARATOR);
		const existingParts = Array.isArray(existingPath) ? existingPath : existingPath.split(PATH_SEPARATOR);

		if (childParts.length <= existingParts.length) {
			return false;
		}

		return !(existingParts.some((part, index) => part !== childParts[index]));
	};

	// Unified handler for SmartClone-based method execution
	const handleMethodExecution = (target, thisArg, thisProxyTarget, argumentsList) => {
		// Standard SmartClone path for all handled types including Date
		let applyPath = path.initial(cache.getPath(target));
		const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, target.name);

		smartClone.start(thisProxyTarget, applyPath, argumentsList);

		let result;
		// Special handling for array search methods that need proxy-aware comparison
		if (Array.isArray(thisProxyTarget) && ['indexOf', 'lastIndexOf', 'includes'].includes(target.name)) {
			result = performProxyAwareArraySearch({
				proxyArray: thisProxyTarget,
				methodName: target.name,
				searchElement: argumentsList[0],
				fromIndex: argumentsList[1],
				getProxyTarget,
			});
		} else {
			result = Reflect.apply(
				target,
				smartClone.preferredThisArg(target, thisArg, thisProxyTarget),
				isHandledMethod
					? argumentsList.map(argument => getProxyTarget(argument))
					: argumentsList,
			);
		}

		const isChanged = smartClone.isChanged(thisProxyTarget, equals);
		const previous = smartClone.stop();

		if (SmartClone.isHandledType(result) && isHandledMethod) {
			if (thisArg instanceof Map && target.name === 'get') {
				applyPath = path.concat(applyPath, argumentsList[0]);
			}

			result = cache.getProxy(result, applyPath, handler);
		}

		if (isChanged) {
			// Provide applyData based on details configuration
			const shouldProvideApplyData = details === false
				|| details === true
				|| (Array.isArray(details) && details.includes(target.name));
			const applyData = shouldProvideApplyData ? {
				name: target.name,
				args: argumentsList,
				result,
			} : undefined;

			const changePath = smartClone.isCloning
				? path.initial(applyPath)
				: applyPath;
			const property = smartClone.isCloning
				? path.last(applyPath)
				: '';

			if (validate(path.get(object, changePath), property, thisProxyTarget, previous, applyData)) {
				handleChange(changePath, property, thisProxyTarget, previous, applyData);
			} else {
				smartClone.undo(thisProxyTarget);
			}
		}

		if (
			(thisArg instanceof Map || thisArg instanceof Set)
			&& isIterator(result)
		) {
			return wrapIterator(result, target, thisArg, applyPath, prepareValue);
		}

		return result;
	};

	const handler = {
		get(target, property, receiver) {
			if (isSymbol(property)) {
				if (property === proxyTarget || property === TARGET) {
					return target;
				}

				if (
					property === UNSUBSCRIBE
					&& !cache.isUnsubscribed
					&& cache.getPath(target).length === 0
				) {
					cache.unsubscribe();
					return target;
				}
			}

			const value = isBuiltinWithMutableMethods(target)
				? Reflect.get(target, property)
				: Reflect.get(target, property, receiver);

			return prepareValue(value, target, property);
		},

		set(target, property, value, receiver) {
			value = getProxyTarget(value);

			const reflectTarget = target[proxyTarget] ?? target;
			const previous = reflectTarget[property];

			if (equals(previous, value) && property in target) {
				return true;
			}

			const isValid = validate(target, property, value, previous);

			if (
				isValid
				&& cache.setProperty(reflectTarget, property, value, receiver, previous)
			) {
				handleChangeOnTarget(target, property, target[property], previous);

				return true;
			}

			return !isValid;
		},

		defineProperty(target, property, descriptor) {
			if (!cache.isSameDescriptor(descriptor, target, property)) {
				const previous = target[property];

				if (
					validate(target, property, descriptor.value, previous)
					&& cache.defineProperty(target, property, descriptor, previous)
				) {
					// For accessor descriptors (getters/setters), descriptor.value is undefined
					// We need to get the actual value after the property is defined
					const hasValue = Object.prototype.hasOwnProperty.call(descriptor, 'value');
					const value = hasValue
						? descriptor.value
						: (() => {
							try {
								// Read the actual value through the getter
								return target[property];
							} catch {
								// If the getter throws, use undefined
								return undefined;
							}
						})();

					handleChangeOnTarget(target, property, value, previous);
				}
			}

			return true;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property)) {
				return true;
			}

			const previous = Reflect.get(target, property);
			const isValid = validate(target, property, undefined, previous);

			if (
				isValid
				&& cache.deleteProperty(target, property, previous)
			) {
				handleChangeOnTarget(target, property, undefined, previous);

				return true;
			}

			return !isValid;
		},

		apply(target, thisArg, argumentsList) {
			const thisProxyTarget = thisArg[proxyTarget] ?? thisArg;

			if (cache.isUnsubscribed) {
				return Reflect.apply(target, thisProxyTarget, argumentsList);
			}

			// Check if SmartClone should be used for aggregate change tracking
			if (SmartClone.isHandledType(thisProxyTarget)) {
				// Skip SmartClone for custom methods on plain objects to enable property-level tracking
				// Note: This approach doesn't support private fields (#field) which require the original instance
				const isPlainObjectCustomMethod = isObject(thisProxyTarget)
					&& !SmartClone.isHandledMethod(thisProxyTarget, target.name);

				if (!isPlainObjectCustomMethod) {
					// Use SmartClone for internal methods or based on details configuration
					const isInternalMethod = typeof target.name === 'symbol'
						|| ['values', 'keys', 'entries'].includes(target.name);

					const shouldUseSmartClone = isInternalMethod
						|| details === false
						|| (Array.isArray(details) && !details.includes(target.name));

					if (shouldUseSmartClone) {
						return handleMethodExecution(target, thisArg, thisProxyTarget, argumentsList);
					}
				}
			}

			// Handle Date mutations when not using SmartClone
			if (thisProxyTarget instanceof Date && SmartClone.isHandledMethod(thisProxyTarget, target.name)) {
				const clonedDate = new Date(thisProxyTarget.getTime());
				const result = Reflect.apply(target, thisProxyTarget, argumentsList);
				const previousTime = clonedDate.getTime();
				const currentTime = thisProxyTarget.getTime();

				if (!equals(previousTime, currentTime)) {
					const applyPath = cache.getPath(thisProxyTarget);
					const shouldProvideApplyData = details === true
						|| (Array.isArray(details) && details.includes(target.name));
					const applyData = shouldProvideApplyData ? {
						name: target.name,
						args: argumentsList,
						result,
					} : undefined;

					if (validate(path.get(object, applyPath), '', thisProxyTarget, clonedDate, applyData)) {
						handleChange(applyPath, '', thisProxyTarget, clonedDate, applyData);
					} else {
						// Undo the change if validation fails
						thisProxyTarget.setTime(previousTime);
					}
				}

				return result;
			}

			// Use the proxy (thisArg) as 'this' to ensure property mutations go through proxy traps
			return Reflect.apply(target, thisArg, argumentsList);
		},
	};

	const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
	onChange = onChange.bind(proxy);

	if (hasOnValidate) {
		options.onValidate = options.onValidate.bind(proxy);
	}

	return proxy;
};

// Helper function for array search methods that need proxy-aware comparison
const performProxyAwareArraySearch = options => {
	const {proxyArray, methodName, searchElement, fromIndex, getProxyTarget} = options;
	const {length} = proxyArray;

	if (length === 0) {
		return methodName === 'includes' ? false : -1;
	}

	// Parse fromIndex according to ECMAScript specification
	const isLastIndexOf = methodName === 'lastIndexOf';
	let startIndex = fromIndex === undefined
		? (isLastIndexOf ? length - 1 : 0)
		: Math.trunc(Number(fromIndex)) || 0;

	if (startIndex < 0) {
		startIndex = Math.max(0, length + startIndex);
	} else if (isLastIndexOf) {
		startIndex = Math.min(startIndex, length - 1);
	}

	// Cache the search element's target for efficiency
	const searchTarget = getProxyTarget(searchElement);

	// Search with both proxy and target comparison
	const searchBackward = methodName === 'lastIndexOf';
	const endIndex = searchBackward ? -1 : length;
	const step = searchBackward ? -1 : 1;

	for (let index = startIndex; searchBackward ? index > endIndex : index < endIndex; index += step) {
		const element = proxyArray[index];
		if (element === searchElement || getProxyTarget(element) === searchTarget) {
			return methodName === 'includes' ? true : index;
		}
	}

	return methodName === 'includes' ? false : -1;
};

onChange.target = proxy => proxy?.[TARGET] ?? proxy;
onChange.unsubscribe = proxy => proxy?.[UNSUBSCRIBE] ?? proxy;

export default onChange;
