'use strict';

const path = require('./path');
const isArray = require('./is-array');

class smartClone {
	constructor() {
		this.done();
	}

	shallowClone(value) {
		let clone;

		if (isArray(value)) {
			clone = value.slice();
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
		if (this._cache !== undefined) {
			this._cache.clear();
		}

		this.clone = null;
		this.isCloning = false;
		this._path = null;
		this._isChanged = false;
	}

	isChanged(isMutable, value, equals) {
		if (isMutable) {
			return !equals(this.clone.valueOf(), value.valueOf());
		}

		return this._isChanged;
	}
}

module.exports = smartClone;
