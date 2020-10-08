'use strict';

const path = require('./path');
const isArray = require('./is-array');
const isBuiltin = require('./is-builtin');
const isObject = require('./is-object');

const certainChange = () => true;

const shallowEqualArrays = (clone, value) => {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
};

const shallowEqualSets = (a, b) => {
	if (a.size !== b.size) {
		return true;
	}

	for (const element of a) {
		if (!b.has(element)) {
			return true;
		}
	}

	return false;
};

const shallowEqualMaps = (a, b) => {
	if (a.size !== b.size) {
		return true;
	}

	let bValue;
	for (const [key, aValue] of a) {
		bValue = b.get(key);

		if (bValue !== aValue || (bValue === undefined && !b.has(key))) {
			return true;
		}
	}

	return false;
};

const IMMUTABLE_OBJECT_METHODS = new Set([
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toLocaleString',
	'toString',
	'valueOf'
]);

const IMMUTABLE_ARRAY_METHODS = new Set([
	'includes',
	'indexOf',
	'join',
	'keys',
	'lastIndexOf'
]);

const IMMUTABLE_SET_METHODS = new Set([
	'has',
	'toString',
	'keys'
]);

const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS].concat(['get']));

const SHALLOW_MUTABLE_ARRAY_METHODS = {
	push: certainChange,
	pop: certainChange,
	shift: certainChange,
	unshift: certainChange,
	concat: (clone, value) => clone.length !== value.length,
	copyWithin: shallowEqualArrays,
	reverse: shallowEqualArrays,
	sort: shallowEqualArrays,
	splice: shallowEqualArrays,
	flat: shallowEqualArrays,
	fill: shallowEqualArrays
};

const SHALLOW_MUTABLE_SET_METHODS = {
	add: shallowEqualSets,
	clear: shallowEqualSets,
	delete: shallowEqualSets
};

const SHALLOW_MUTABLE_MAP_METHODS = {
	set: shallowEqualMaps,
	clear: shallowEqualMaps,
	delete: shallowEqualMaps
};

const HANDLED_ARRAY_METHODS = new Set([...IMMUTABLE_OBJECT_METHODS]
	.concat([...IMMUTABLE_ARRAY_METHODS])
	.concat(Object.keys(SHALLOW_MUTABLE_ARRAY_METHODS)));

const HANDLED_SET_METHODS = new Set([...IMMUTABLE_SET_METHODS]
	.concat(Object.keys(SHALLOW_MUTABLE_SET_METHODS)));

const HANDLED_MAP_METHODS = new Set([...IMMUTABLE_MAP_METHODS]
	.concat(Object.keys(SHALLOW_MUTABLE_MAP_METHODS)));

class smartClone {
	constructor() {
		this.done();
	}

	_shallowClone(value) {
		let clone;

		if (isObject(value)) {
			clone = {...value};
		} else if (isArray(value)) {
			clone = [...value];
		} else if (value instanceof Date) {
			clone = new Date(value);
		} else if (value instanceof Set) {
			clone = new Set(value);
		} else if (value instanceof Map) {
			clone = new Map(value);
		}

		this._cache.add(clone);

		return clone;
	}

	start(value, path, argumentsList) {
		if (this._cache === undefined) {
			this._cache = new Set();
		}

		if (value instanceof WeakSet) {
			this._weakValue = value.has(argumentsList[0]);
		} else if (value instanceof WeakMap) {
			this._weakValue = value.get(argumentsList[0]);
		} else {
			this.clone = path === undefined ? value : this._shallowClone(value);
		}

		this._path = path;
		this.isCloning = true;
	}

	isHandledType(value) {
		return isObject(value) ||
			isArray(value) ||
			isBuiltin.withMutableMethods(value);
	}

	isHandledMethod(target, name) {
		if (isObject(target)) {
			return IMMUTABLE_OBJECT_METHODS.has(name);
		}

		if (isArray(target)) {
			return HANDLED_ARRAY_METHODS.has(name);
		}

		if (target instanceof Set) {
			return HANDLED_SET_METHODS.has(name);
		}

		if (target instanceof Map) {
			return HANDLED_MAP_METHODS.has(name);
		}

		return target instanceof WeakSet || target instanceof WeakMap;
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;

		if (this.isHandledMethod(thisProxyTarget, name)) {
			if (isArray(thisProxyTarget)) {
				this._onIsChanged = SHALLOW_MUTABLE_ARRAY_METHODS[name];
			} else if (thisProxyTarget instanceof Set) {
				this._onIsChanged = SHALLOW_MUTABLE_SET_METHODS[name];
			} else if (thisProxyTarget instanceof Map) {
				this._onIsChanged = SHALLOW_MUTABLE_MAP_METHODS[name];
			}

			return thisProxyTarget;
		}

		return thisArg;
	}

	update(fullPath, property, value) {
		if (value !== undefined && property !== 'length') {
			let object = this.clone;

			path.walk(path.after(fullPath, this._path), key => {
				if (!this._cache.has(object[key])) {
					object[key] = this._shallowClone(object[key]);
				}

				object = object[key];
			});

			object[property] = value;
		}

		this._isChanged = true;
	}

	done() {
		const {clone} = this;

		if (this._cache !== undefined) {
			this._cache.clear();
		}

		this.clone = undefined;
		this._weakValue = undefined;
		this.isCloning = false;
		this._path = null;
		this._onIsChanged = null;
		this._isChanged = false;

		return clone;
	}

	isChanged(isMutable, value, equals, argumentsList) {
		if (isMutable) {
			if (value instanceof Date) {
				return !equals(this.clone.valueOf(), value.valueOf());
			}

			if (value instanceof WeakSet) {
				return this._weakValue !== value.has(argumentsList[0]);
			}

			if (value instanceof WeakMap) {
				return this._weakValue !== value.get(argumentsList[0]);
			}
		}

		return this._onIsChanged ?
			this._onIsChanged(this.clone, value) :
			this._isChanged;
	}
}

module.exports = smartClone;
