'use strict';

const path = require('./path');
const isArray = require('./is-array');
const isBuiltin = require('./is-builtin');
const isObject = require('./is-object');

const certainChange = () => true;

const shallowEqualArrays = (clone, value) => {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
};

const shallowEqualSets = (clone, value) => {
	if (clone.size !== value.size) {
		return true;
	}

	for (const element of clone) {
		if (!value.has(element)) {
			return true;
		}
	}

	return false;
};

const shallowEqualMaps = (clone, value) => {
	if (clone.size !== value.size) {
		return true;
	}

	let bValue;
	for (const [key, aValue] of clone) {
		bValue = value.get(key);

		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
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
	'concat',
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

class Clone {
	constructor(value, path, argumentsList) {
		this._path = path;
		this._isChanged = false;
		this._clonedCache = new Set();

		if (value instanceof WeakSet) {
			this._weakValue = value.has(argumentsList[0]);
		} else if (value instanceof WeakMap) {
			this._weakValue = value.get(argumentsList[0]);
		} else {
			this.clone = path === undefined ? value : this._shallowClone(value);
		}
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

		this._clonedCache.add(clone);

		return clone;
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;

		if (SmartClone.isHandledMethod(thisProxyTarget, name)) {
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
				if (!this._clonedCache.has(object[key])) {
					object[key] = this._shallowClone(object[key]);
				}

				object = object[key];
			});

			object[property] = value;
		}

		this._isChanged = true;
	}

	isChanged(value, equals, argumentsList) {
		if (value instanceof Date) {
			return !equals(this.clone.valueOf(), value.valueOf());
		}

		if (value instanceof WeakSet) {
			return this._weakValue !== value.has(argumentsList[0]);
		}

		if (value instanceof WeakMap) {
			return this._weakValue !== value.get(argumentsList[0]);
		}

		return this._onIsChanged === undefined ?
			this._isChanged :
			this._onIsChanged(this.clone, value);
	}
}

class SmartClone {
	constructor() {
		this.stack = [];
	}

	static isHandledType(value) {
		return isObject(value) ||
			isArray(value) ||
			isBuiltin.withMutableMethods(value);
	}

	static isHandledMethod(target, name) {
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

		return isBuiltin.withMutableMethods(target);
	}

	get isCloning() {
		return this.stack.length !== 0;
	}

	start(value, path, argumentsList) {
		this.stack.push(new Clone(value, path, argumentsList));
	}

	update(fullPath, property, value) {
		this.stack[this.stack.length - 1].update(fullPath, property, value);
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		return this.stack[this.stack.length - 1].preferredThisArg(target, thisArg, thisProxyTarget);
	}

	isChanged(isMutable, value, equals, argumentsList) {
		return this.stack[this.stack.length - 1].isChanged(isMutable, value, equals, argumentsList);
	}

	stop() {
		return this.stack.pop().clone;
	}
}

module.exports = SmartClone;
