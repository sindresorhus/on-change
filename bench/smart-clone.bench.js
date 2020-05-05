/* globals suite benchmark */
'use strict';

const SmartClone = require('../lib/smart-clone');
const {benchSettings} = require('karma-webpack-bundle');
let temporaryTarget;

suite('SmartClone', () => {
	const object = {
		a: 1,
		b: 2,
		c: 3
	};
	const array = [1, 2, 3];
	const smartClone = new SmartClone();
	smartClone.start();

	benchmark('init', () => {
		temporaryTarget = new SmartClone();
	}, benchSettings);

	benchmark('init and start', () => {
		new SmartClone()
			.start('a');
	}, benchSettings);

	benchmark('shallowClone object', () => {
		temporaryTarget = smartClone.shallowClone(object);
	}, benchSettings);

	benchmark('shallowClone array', () => {
		temporaryTarget = smartClone.shallowClone(array);
	}, benchSettings);

	benchmark('start, path', () => {
		new SmartClone()
			.start(array, 'a');
	}, benchSettings);

	benchmark('start, no path', () => {
		new SmartClone()
			.start('a');
	}, benchSettings);

	benchmark('update, object', () => {
		temporaryTarget = new SmartClone();
		temporaryTarget.start({}, '');
		temporaryTarget.update('', 'a', 1);
	}, benchSettings);

	benchmark('update, array', () => {
		temporaryTarget = new SmartClone();
		temporaryTarget.start([], '');
		temporaryTarget.update('', '0', 1);
	}, benchSettings);
});
