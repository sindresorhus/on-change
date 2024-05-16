import SmartClone from '../lib/smart-clone/smart-clone.js';
import {suite} from './utils.js';

let temporaryTarget;

await suite('SmartClone', bench => {
	const array = [1, 2, 3];
	const smartClone = new SmartClone();
	smartClone.start();

	bench
		.add('init', () => {
			temporaryTarget = new SmartClone();
		})
		.add('init and start', () => {
			new SmartClone()
				.start('a');
		})
		.add('start, path', () => {
			new SmartClone()
				.start(array, 'a');
		})
		.add('start, no path', () => {
			new SmartClone()
				.start('a');
		})
		.add('update, object', () => {
			temporaryTarget = new SmartClone();
			temporaryTarget.start({}, '');
			temporaryTarget.update('', 'a', 1);
		})
		.add('update, array', () => {
			temporaryTarget = new SmartClone();
			temporaryTarget.start([], '');
			temporaryTarget.update('', '0', 1);
		});
});
