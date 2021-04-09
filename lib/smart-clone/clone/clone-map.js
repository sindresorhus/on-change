'use strict';

const CloneObject = require('./clone-object.js');
const {HANDLED_MAP_METHODS} = require('../methods/map.js');

module.exports = class CloneMap extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_MAP_METHODS.has(name);
	}

	undo(object) {
		for (const [key, value] of this.clone.entries()) {
			object.set(key, value);
		}

		for (const key of object.keys()) {
			if (!this.clone.has(key)) {
				object.delete(key);
			}
		}
	}
};
