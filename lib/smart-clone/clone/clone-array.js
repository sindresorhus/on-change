'use strict';

const CloneObject = require('./clone-object.js');
const {HANDLED_ARRAY_METHODS} = require('../methods/array.js');

module.exports = class CloneArray extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_ARRAY_METHODS.has(name);
	}
};
