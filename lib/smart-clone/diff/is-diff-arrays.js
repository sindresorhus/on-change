'use strict';

module.exports = (clone, value) => {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
};
