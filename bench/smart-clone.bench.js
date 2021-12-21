/* globals suite benchmark */
import {benchSettings} from 'karma-webpack-bundle';
import SmartClone from '../lib/smart-clone/smart-clone.js';

let temporaryTarget;

suite('SmartClone', () => {
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
