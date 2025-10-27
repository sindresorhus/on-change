import path from './path.js';

/**
@class Cache
@private
*/
export default class Cache {
	constructor(equals) {
		this._equals = equals;
		this._proxyCache = new WeakMap();
		this._pathCache = new WeakMap();
		this._allPathsCache = new WeakMap();
		this.isUnsubscribed = false;
	}

	_pathsEqual(pathA, pathB) {
		if (!Array.isArray(pathA) || !Array.isArray(pathB)) {
			return pathA === pathB;
		}

		return pathA.length === pathB.length
			&& pathA.every((part, index) => part === pathB[index]);
	}

	_getDescriptorCache() {
		if (this._descriptorCache === undefined) {
			this._descriptorCache = new WeakMap();
		}

		return this._descriptorCache;
	}

	_getProperties(target) {
		const descriptorCache = this._getDescriptorCache();
		let properties = descriptorCache.get(target);

		if (properties === undefined) {
			properties = {};
			descriptorCache.set(target, properties);
		}

		return properties;
	}

	_getOwnPropertyDescriptor(target, property) {
		if (this.isUnsubscribed) {
			return Reflect.getOwnPropertyDescriptor(target, property);
		}

		const properties = this._getProperties(target);
		let descriptor = properties[property];

		if (descriptor === undefined) {
			descriptor = Reflect.getOwnPropertyDescriptor(target, property);
			properties[property] = descriptor;
		}

		return descriptor;
	}

	getProxy(target, path, handler, proxyTarget) {
		if (this.isUnsubscribed) {
			return target;
		}

		const reflectTarget = proxyTarget === undefined ? undefined : target[proxyTarget];
		const source = reflectTarget ?? target;

		// Always set the primary path (for backward compatibility)
		this._pathCache.set(source, path);

		// Track all paths for this object
		let allPaths = this._allPathsCache.get(source);
		if (!allPaths) {
			allPaths = [];
			this._allPathsCache.set(source, allPaths);
		}

		// Add path if it doesn't already exist
		const pathExists = allPaths.some(existingPath => this._pathsEqual(existingPath, path));
		if (!pathExists) {
			allPaths.push(path);
		}

		let proxy = this._proxyCache.get(source);

		if (proxy === undefined) {
			proxy = reflectTarget === undefined
				? new Proxy(target, handler)
				: target;

			this._proxyCache.set(source, proxy);
		}

		return proxy;
	}

	getPath(target) {
		return this.isUnsubscribed ? undefined : this._pathCache.get(target);
	}

	getAllPaths(target) {
		if (this.isUnsubscribed) {
			return undefined;
		}

		return this._allPathsCache.get(target);
	}

	isDetached(target, object) {
		return !Object.is(target, path.get(object, this.getPath(target)));
	}

	defineProperty(target, property, descriptor) {
		if (!Reflect.defineProperty(target, property, descriptor)) {
			return false;
		}

		if (!this.isUnsubscribed) {
			this._getProperties(target)[property] = descriptor;
		}

		return true;
	}

	setProperty(target, property, value, receiver, previous) { // eslint-disable-line max-params
		if (!this._equals(previous, value) || !(property in target)) {
			// Check if there's a setter anywhere in the prototype chain
			let hasSetterInChain = false;
			let current = target;
			while (current) {
				const descriptor = Reflect.getOwnPropertyDescriptor(current, property);

				if (descriptor && 'set' in descriptor) {
					hasSetterInChain = true;
					break;
				}

				current = Object.getPrototypeOf(current);
			}

			if (hasSetterInChain) {
				// Use receiver to ensure setter gets proxy as 'this'
				return Reflect.set(target, property, value, receiver);
			}

			// For simple properties, don't use receiver to maintain existing behavior
			return Reflect.set(target, property, value);
		}

		return true;
	}

	deleteProperty(target, property, previous) {
		if (Reflect.deleteProperty(target, property)) {
			if (!this.isUnsubscribed) {
				const properties = this._getDescriptorCache().get(target);

				if (properties) {
					delete properties[property];
					this._pathCache.delete(previous);
				}
			}

			return true;
		}

		return false;
	}

	isSameDescriptor(a, target, property) {
		const b = this._getOwnPropertyDescriptor(target, property);

		return a !== undefined
			&& b !== undefined
			&& Object.is(a.value, b.value)
			&& (a.writable || false) === (b.writable || false)
			&& (a.enumerable || false) === (b.enumerable || false)
			&& (a.configurable || false) === (b.configurable || false)
			&& a.get === b.get
			&& a.set === b.set;
	}

	isGetInvariant(target, property) {
		const descriptor = this._getOwnPropertyDescriptor(target, property);

		return descriptor !== undefined
			&& descriptor.configurable !== true
			&& descriptor.writable !== true;
	}

	unsubscribe() {
		this._descriptorCache = null;
		this._pathCache = null;
		this._proxyCache = null;
		this._allPathsCache = null;
		this.isUnsubscribed = true;
	}
}
