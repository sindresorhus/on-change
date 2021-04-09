'use strict';

const CloneObject = require('./clone-object.js');

module.exports = class CloneDate extends CloneObject {
	undo(object) {
		object.setTime(this.clone.getTime());
	}

	isChanged(value, equals) {
		return !equals(this.clone.valueOf(), value.valueOf());
	}
};
