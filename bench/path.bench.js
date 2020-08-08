/* globals suite benchmark */
'use strict';

const path = require('../lib/path');
const {benchSettings} = require('karma-webpack-bundle');
let temporaryTarget;

suite('path.after', () => {
	benchmark('string empty', () => {
		temporaryTarget = path.after('', '');
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = path.after('a.b.c', 'a.b');
	}, benchSettings);

	benchmark('array empty', () => {
		temporaryTarget = path.after([], []);
	}, benchSettings);

	benchmark('array', () => {
		temporaryTarget = path.after(['a', 'b', 'c'], ['a', 'b']);
	}, benchSettings);
});

suite('path.concat', () => {
	const symbol = Symbol('test');

	benchmark('string empty', () => {
		temporaryTarget = path.concat('', '');
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = path.concat('a.b', 'c');
	}, benchSettings);

	benchmark('string + Symbol', () => {
		temporaryTarget = path.concat('a.b', symbol);
	}, benchSettings);

	benchmark('array empty', () => {
		temporaryTarget = path.concat([], '');
	}, benchSettings);

	benchmark('array', () => {
		temporaryTarget = path.concat(['a', 'b'], 'c');
	}, benchSettings);

	benchmark('array + Symbol', () => {
		temporaryTarget = path.concat(['a', 'b'], symbol);
	}, benchSettings);
});

suite('path.initial', () => {
	benchmark('string empty', () => {
		temporaryTarget = path.initial('');
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = path.initial('a.b.c');
	}, benchSettings);

	benchmark('array empty', () => {
		temporaryTarget = path.initial([]);
	}, benchSettings);

	benchmark('array', () => {
		temporaryTarget = path.initial(['a', 'b', 'c']);
	}, benchSettings);
});

suite('path.walk', () => {
	benchmark('string empty', () => {
		path.walk('', key => {
			temporaryTarget = key;
		});
	}, benchSettings);

	benchmark('string single key', () => {
		path.walk('a', key => {
			temporaryTarget = key;
		});
	}, benchSettings);

	benchmark('string three keys', () => {
		path.walk('a.b.c', key => {
			temporaryTarget = key;
		});
	}, benchSettings);

	benchmark('array empty', () => {
		path.walk([], key => {
			temporaryTarget = key;
		});
	}, benchSettings);

	benchmark('array single key', () => {
		path.walk(['a'], key => {
			temporaryTarget = key;
		});
	}, benchSettings);

	benchmark('array three keys', () => {
		path.walk(['a', 'b', 'c'], key => {
			temporaryTarget = key; // eslint-disable-line no-unused-vars
		});
	}, benchSettings);
});
