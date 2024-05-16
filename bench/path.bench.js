/* eslint-disable unicorn/prefer-spread */
import path from '../lib/path.js';
import {suite} from './utils.js';

let temporaryTarget; // eslint-disable-line no-unused-vars

await suite('path.after', bench => {
	bench
		.add('string empty', () => {
			temporaryTarget = path.after('', '');
		})
		.add('string', () => {
			temporaryTarget = path.after('a.b.c', 'a.b');
		})
		.add('array empty', () => {
			temporaryTarget = path.after([], []);
		})
		.add('array', () => {
			temporaryTarget = path.after(['a', 'b', 'c'], ['a', 'b']);
		});
});

await suite('path.concat', bench => {
	const symbol = Symbol('test');

	bench
		.add('string empty', () => {
			temporaryTarget = path.concat('', '');
		})
		.add('string', () => {
			temporaryTarget = path.concat('a.b', 'c');
		})
		.add('string + Symbol', () => {
			temporaryTarget = path.concat('a.b', symbol);
		})
		.add('array empty', () => {
			temporaryTarget = path.concat([], '');
		})
		.add('array', () => {
			temporaryTarget = path.concat(['a', 'b'], 'c');
		})
		.add('array + Symbol', () => {
			temporaryTarget = path.concat(['a', 'b'], symbol);
		});
});

await suite('path.initial', bench => {
	bench
		.add('string empty', () => {
			temporaryTarget = path.initial('');
		})
		.add('string', () => {
			temporaryTarget = path.initial('a.b.c');
		})
		.add('array empty', () => {
			temporaryTarget = path.initial([]);
		})
		.add('array', () => {
			temporaryTarget = path.initial(['a', 'b', 'c']);
		});
});

await suite('path.walk', bench => {
	bench
		.add('string empty', () => {
			path.walk('', key => {
				temporaryTarget = key;
			});
		})
		.add('string single key', () => {
			path.walk('a', key => {
				temporaryTarget = key;
			});
		})
		.add('string three key', () => {
			path.walk('a.b.c', key => {
				temporaryTarget = key;
			});
		})
		.add('array empty', () => {
			path.walk([], key => {
				temporaryTarget = key;
			});
		})
		.add('array single key', () => {
			path.walk(['a'], key => {
				temporaryTarget = key;
			});
		})
		.add('array three key', () => {
			path.walk(['a', 'b', 'c'], key => {
				temporaryTarget = key;
			});
		});
});
