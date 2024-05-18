import Cache from '../lib/cache.js';
import {suite} from './utils.js';

let temporaryTarget;

await suite('Cache init', bench => {
	bench
		.add('init', () => {
			temporaryTarget = new Cache();
		})
		.add('getProxy', () => {
			temporaryTarget = new Cache();
			temporaryTarget.getProxy({}, '', {});
		});
});
