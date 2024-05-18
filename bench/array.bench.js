import onChange from '../index.js';
import {suite} from './utils.js';

let temporaryTarget; // eslint-disable-line no-unused-vars
const callback = function () {};
let value = 0;

const buildArray = length => Array.from({length})
	.fill(0)
	.map((value, index) => ({a: index}));

const sizes = [{
	size: 10,
	name: 'small',
}, {
	size: 100_000,
	name: 'large',
}];

const commonBench = (bench, objectCallback) => {
	for (const [index, option] of sizes.entries()) {
		const separator = (index === sizes.length - 1)
			? ''
			: '     ' + '_'.repeat(20 - option.name.length);

		const taskOptions = options => ({
			beforeAll() {
				this.o = onChange(buildArray(option.size), callback, options);
			},
			afterAll() {
				delete this.o;
			},
		});

		const simpleTaskOptions = {
			beforeAll() {
				this.o = buildArray(option.size);
			},
			afterAll() {
				delete this.o;
			},
		};

		bench
			.add(`(${option.name}) no options`, function () {
				objectCallback(this.o);
			}, taskOptions())
			.add(`(${option.name}) isShallow`, function () {
				objectCallback(this.o);
			}, taskOptions({isShallow: true}))
			.add(`(${option.name}) pathAsArray`, function () {
				objectCallback(this.o);
			}, taskOptions({pathAsArray: true}))
			.add(`(${option.name}) empty Proxy`, function () {
				objectCallback(new Proxy(this.o, {}));
			}, simpleTaskOptions)
			.add(`(${option.name}) native ${separator}`, function () {
				objectCallback(this.o);
			}, simpleTaskOptions);
	}
};

await suite('on-change init with array', bench => {
	const array = buildArray(sizes[0].size);

	bench
		.add('new Proxy', () => {
			temporaryTarget = new Proxy(array, {});
		})
		.add('no options', () => {
			onChange(array, callback);
		})
		.add('pathAsArray', () => {
			onChange(array, callback, {pathAsArray: true});
		})
		.add('fat-arrow', () => {
			onChange(array, () => {});
		});
});

await suite('on-change with array, read', bench => {
	commonBench(bench, array => {
		temporaryTarget = array[3];
	});
});

await suite('on-change with array, read nested', bench => {
	commonBench(bench, array => {
		temporaryTarget = array[3].a;
	});
});

await suite('on-change with array, write', bench => {
	commonBench(bench, array => {
		array[2] = value++;
	});
});

await suite('on-change with array, write nested', bench => {
	commonBench(bench, array => {
		array[4].a = value++;
	});
});

await suite('on-change with array, read in apply', bench => {
	commonBench(bench, array => {
		array.some((value, index) => {
			temporaryTarget = array[index];
			return true;
		});
	});
});

await suite('on-change with array, write in apply', bench => {
	commonBench(bench, array => {
		array.some((value, index) => {
			array[index] = value++;
			return true;
		});
	});
});

await suite('on-change with array, push', bench => {
	commonBench(bench, array => {
		array.push(0);
	});
});

await suite('on-change with array, pop', bench => {
	commonBench(bench, array => {
		array.pop();
	});
});

await suite('on-change with array, unshift', bench => {
	commonBench(bench, array => {
		array.unshift(0);
	});
});

await suite('on-change with array, shift', bench => {
	commonBench(bench, array => {
		array.shift();
	});
});

await suite('on-change with array, toString', bench => {
	commonBench(bench, array => {
		temporaryTarget = array.toString();
	});
});
