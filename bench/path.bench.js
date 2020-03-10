/* globals suite benchmark */
'use strict';

const path = require('../lib/path');
const {benchSettings} = require('karma-webpack-bundle');
let tempTarget; // eslint-disable-line no-unused-vars

suite('path.after', () => {
	benchmark('string empty', () => {
		tempTarget = path.after('', '');
	}, benchSettings);

	benchmark('string', () => {
		tempTarget = path.after('a.b.c', 'a.b');
	}, benchSettings);

	benchmark('array empty', () => {
		tempTarget = path.after([], []);
	}, benchSettings);

	benchmark('array', () => {
		tempTarget = path.after(['a', 'b', 'c'], ['a', 'b']);
	}, benchSettings);
});

suite('path.concat', () => {
	const symbol = Symbol('test');

	benchmark('string empty', () => {
		tempTarget = path.concat('', '');
	}, benchSettings);

	benchmark('string', () => {
		tempTarget = path.concat('a.b', 'c');
	}, benchSettings);

	benchmark('string + Symbol', () => {
		tempTarget = path.concat('a.b', symbol);
	}, benchSettings);

	benchmark('array empty', () => {
		tempTarget = path.concat([], '');
	}, benchSettings);

	benchmark('array', () => {
		tempTarget = path.concat(['a', 'b'], 'c');
	}, benchSettings);

	benchmark('array + Symbol', () => {
		tempTarget = path.concat(['a', 'b'], symbol);
	}, benchSettings);
});

suite('path.initial', () => {
	benchmark('string empty', () => {
		tempTarget = path.initial('');
	}, benchSettings);

	benchmark('string', () => {
		tempTarget = path.initial('a.b.c');
	}, benchSettings);

	benchmark('array empty', () => {
		tempTarget = path.initial([]);
	}, benchSettings);

	benchmark('array', () => {
		tempTarget = path.initial(['a', 'b', 'c']);
	}, benchSettings);
});

suite('path.walk', () => {
	benchmark('string empty', () => {
		path.walk('', key => {
			tempTarget = key;
		});
	}, benchSettings);

	benchmark('string single key', () => {
		path.walk('a', key => {
			tempTarget = key;
		});
	}, benchSettings);

	benchmark('string three keys', () => {
		path.walk('a.b.c', key => {
			tempTarget = key;
		});
	}, benchSettings);

	benchmark('array empty', () => {
		path.walk([], key => {
			tempTarget = key;
		});
	}, benchSettings);

	benchmark('array single key', () => {
		path.walk(['a'], key => {
			tempTarget = key;
		});
	}, benchSettings);

	benchmark('array three keys', () => {
		path.walk(['a', 'b', 'c'], key => {
			tempTarget = key;
		});
	}, benchSettings);
});
