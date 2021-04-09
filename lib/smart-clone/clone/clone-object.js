'use strict';

const path = require('../../path.js');
const isArray = require('../../is-array.js');
const isObject = require('../../is-object.js');
const {MUTABLE_ARRAY_METHODS} = require('../methods/array.js');
const {MUTABLE_SET_METHODS} = require('../methods/set.js');
const {MUTABLE_MAP_METHODS} = require('../methods/map.js');
const {IMMUTABLE_OBJECT_METHODS} = require('../methods/object.js');

module.exports = class CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		this._path = path;
		this._isChanged = false;
		this._clonedCache = new Set();
		this._hasOnValidate = hasOnValidate;
		this._changes = hasOnValidate ? [] : null;

		this.clone = path === undefined ? value : this._shallowClone(value);
	}

	static isHandledMethod(name) {
		return IMMUTABLE_OBJECT_METHODS.has(name);
	}

	_shallowClone(value) {
		let clone = value;

		if (isObject(value)) {
			clone = {...value};
		} else if (isArray(value)) {
			clone = [...value];
		} else if (value instanceof Date) {
			clone = new Date(value);
		} else if (value instanceof Set) {
			clone = new Set([...value].map(item => this._shallowClone(item)));
		} else if (value instanceof Map) {
			clone = new Map();

			for (const [key, item] of value.entries()) {
				clone.set(key, this._shallowClone(item));
			}
		}

		this._clonedCache.add(clone);

		return clone;
	}

	preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget) {
		if (isHandledMethod) {
			if (isArray(thisProxyTarget)) {
				this._onIsChanged = MUTABLE_ARRAY_METHODS[name];
			} else if (thisProxyTarget instanceof Set) {
				this._onIsChanged = MUTABLE_SET_METHODS[name];
			} else if (thisProxyTarget instanceof Map) {
				this._onIsChanged = MUTABLE_MAP_METHODS[name];
			}

			return thisProxyTarget;
		}

		return thisArg;
	}

	update(fullPath, property, value) {
		const changePath = path.after(fullPath, this._path);

		if (property !== 'length') {
			let object = this.clone;

			path.walk(changePath, key => {
				if (object && object[key]) {
					if (!this._clonedCache.has(object[key])) {
						object[key] = this._shallowClone(object[key]);
					}

					object = object[key];
				}
			});

			if (this._hasOnValidate) {
				this._changes.push({
					path: changePath,
					property,
					previous: value
				});
			}

			if (object && object[property]) {
				object[property] = value;
			}
		}

		this._isChanged = true;
	}

	undo(object) {
		let change;

		for (let index = this._changes.length - 1; index !== -1; index--) {
			change = this._changes[index];

			path.get(object, change.path)[change.property] = change.previous;
		}
	}

	isChanged(value) {
		return this._onIsChanged === undefined ?
			this._isChanged :
			this._onIsChanged(this.clone, value);
	}
};
