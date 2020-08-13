'use strict';

const path = require('./path');
const isArray = require('./is-array');
const isObject = require('./is-object');

const shallowEqual = (clone, value) => {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
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

const SHALLOW_MUTABLE_ARRAY_METHODS = {
	push: () => true,
	pop: () => true,
	shift: () => true,
	unshift: () => true,
	concat: (clone, value) => clone.length !== value.length,
	copyWithin: shallowEqual,
	reverse: shallowEqual,
	sort: shallowEqual,
	splice: shallowEqual,
	flat: shallowEqual,
	fill: shallowEqual
};

class smartClone {
	constructor() {
		this.done();
	}

	shallowClone(value) {
		let clone;

		if (isArray(value)) {
			clone = [...value];
		} else if (value instanceof Date) {
			clone = new Date(value);
		} else {
			clone = {...value};
		}

		this._cache.add(clone);

		return clone;
	}

	start(value, path) {
		if (this._cache === undefined) {
			this._cache = new Set();
		}

		this.clone = path === undefined ? value : this.shallowClone(value);
		this._path = path;
		this.isCloning = true;
	}

	isHandledMethod(target, name) {
		if (isArray(target) && (IMMUTABLE_OBJECT_METHODS.has(name) ||
			IMMUTABLE_ARRAY_METHODS.has(name) ||
			name in SHALLOW_MUTABLE_ARRAY_METHODS)) {
			return true;
		}

		return isObject(target) && IMMUTABLE_OBJECT_METHODS.has(name);
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;

		if (this.isHandledMethod(thisProxyTarget, name)) {
			if (isArray(thisProxyTarget)) {
				this._onIsChanged = SHALLOW_MUTABLE_ARRAY_METHODS[name];
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
					object[key] = this.shallowClone(object[key]);
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

		this.clone = null;
		this.isCloning = false;
		this._path = null;
		this._onIsChanged = null;
		this._isChanged = false;

		return clone;
	}

	isChanged(isMutable, value, equals) {
		if (isMutable) {
			return !equals(this.clone.valueOf(), value.valueOf());
		}

		return this._onIsChanged ?
			this._onIsChanged(this.clone, value) :
			this._isChanged;
	}
}

module.exports = smartClone;
