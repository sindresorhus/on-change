'use strict';

module.exports = value => typeof value === 'object' && typeof value.next === 'function';
