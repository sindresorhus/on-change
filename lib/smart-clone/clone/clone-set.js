'use strict';

const CloneObject = require('./clone-object.js');
const {HANDLED_SET_METHODS} = require('../methods/set.js');

module.exports = class CloneSet extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_SET_METHODS.has(name);
	}

	undo(object) {
		this.clone.forEach(value => {
			object.add(value);
		});
		object.forEach(value => {
			if (!this.clone.has(value)) {
				object.delete(value);
			}
		});
	}
};

