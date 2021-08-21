/* globals suite benchmark */
import {benchSettings} from 'karma-webpack-bundle.js';
import Cache from '../lib/cache.js';

let temporaryTarget;

suite('Cache init', () => {
	benchmark('init', () => {
		temporaryTarget = new Cache();
	}, benchSettings);

	benchmark('getProxy', () => {
		temporaryTarget = new Cache();
		temporaryTarget.getProxy({}, '', {});
	}, benchSettings);
});
