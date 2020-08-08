/* globals suite benchmark */
'use strict';

const Cache = require('../lib/cache');
const {benchSettings} = require('karma-webpack-bundle');

let temporaryTarget;

suite.only('Cache init', () => {
	benchmark('init', () => {
		temporaryTarget = new Cache();
	}, benchSettings);

	benchmark('getProxy', () => {
		temporaryTarget = new Cache();
		temporaryTarget.getProxy({}, '', {});
	}, benchSettings);
});
