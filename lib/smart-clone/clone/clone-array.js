'use strict';

const CloneObject = require('./clone-object');
const {HANDLED_ARRAY_METHODS} = require('../methods/array');

module.exports = class CloneArray extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_ARRAY_METHODS.has(name);
	}
};
