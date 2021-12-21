/* globals suite benchmark */
import {benchSettings} from 'karma-webpack-bundle';
import onChange from '../index.js';

let temporaryTarget; // eslint-disable-line no-unused-vars
const callback = function () {};
let array = [];
let value = 0;

const buildSettings = before => ({
	...benchSettings,
	onStart: before,
	onCycle: before,
});

const sizes = [{
	size: 10,
	name: 'small',
}, {
	size: 100_000,
	name: 'large',
}];

const commonBench = bench => {
	for (const [index, option] of sizes.entries()) {
		const separator = (index === sizes.length - 1)
			? ''
			: '     ' + '_'.repeat(20 - option.name.length);

		benchmark(`(${option.name}) no options`, bench, buildSettings(() => {
			array = onChange(buildArray(option.size), callback);
		}));

		benchmark(`(${option.name}) isShallow`, bench, buildSettings(() => {
			array = onChange(buildArray(option.size), callback, {isShallow: true});
		}));

		benchmark(`(${option.name}) pathAsArray`, bench, buildSettings(() => {
			array = onChange(buildArray(option.size), callback, {pathAsArray: true});
		}));

		benchmark(`(${option.name}) empty Proxy`, bench, buildSettings(() => {
			array = new Proxy(buildArray(option.size), {});
		}));

		benchmark(`(${option.name}) native ${separator}`, bench, buildSettings(() => {
			array = buildArray(option.size);
		}));
	}
};

const buildArray = length => Array.from({length})
	.fill(0)
	.map((value, index) => ({a: index}));

suite('on-change init with array', () => {
	array = buildArray(sizes[0].size);

	benchmark('new Proxy', () => {
		temporaryTarget = new Proxy(array, {});
	}, benchSettings);

	benchmark('no options', () => {
		onChange(array, callback);
	}, benchSettings);

	benchmark('pathAsArray', () => {
		onChange(array, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('fat-arrow', () => {
		onChange(array, () => {});
	}, benchSettings);
});

suite('on-change with array, read', () => {
	commonBench(() => {
		temporaryTarget = array[3];
	});
});

suite('on-change with array, read nested', () => {
	commonBench(() => {
		temporaryTarget = array[3].a;
	});
});

suite('on-change with array, write', () => {
	commonBench(() => {
		array[2] = value++;
	});
});

suite('on-change with array, write nested', () => {
	commonBench(() => {
		array[4].a = value++;
	});
});

suite('on-change with array, read in apply', () => {
	commonBench(() => {
		array.some((value, index) => {
			temporaryTarget = array[index];
			return true;
		});
	});
});

suite('on-change with array, write in apply', () => {
	commonBench(() => {
		array.some((value, index) => {
			array[index] = value++;
			return true;
		});
	});
});

suite('on-change with array, push', () => {
	commonBench(() => {
		array.push(0);
	});
});

suite('on-change with array, pop', () => {
	commonBench(() => {
		array.pop();
	});
});

suite('on-change with array, unshift', () => {
	commonBench(() => {
		array.unshift(0);
	});
});

suite('on-change with array, shift', () => {
	commonBench(() => {
		array.shift();
	});
});

suite('on-change with array, toString', () => {
	commonBench(() => {
		temporaryTarget = array.toString();
	});
});
