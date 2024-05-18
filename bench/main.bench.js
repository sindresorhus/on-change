import onChange from '../index.js';
import {suite} from './utils.js';

let temporaryTarget; // eslint-disable-line no-unused-vars
const callback = function () {};
let value = 0;

const buildObject = length => {
	let property;
	const object = {
		childObject: {a: 0},
	};

	for (let index = 0; index < length; index++) {
		property = String.fromCodePoint((index % 26) + 97);
		object[property.repeat(Math.ceil((index + 1) / 26))] = 0;
	}

	return object;
};

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
				this.o = onChange(buildObject(option.size), callback, options);
			},
			afterAll() {
				delete this.o;
			},
		});

		const simpleTaskOptions = {
			beforeAll() {
				this.o = buildObject(option.size);
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
			.add(`(${option.name}) ignoreSymbols`, function () {
				objectCallback(this.o);
			}, taskOptions({ignoreSymbols: true}))
			.add(`(${option.name}) ignoreUnderscores`, function () {
				objectCallback(this.o);
			}, taskOptions({ignoreUnderscores: true}))
			.add(`(${option.name}) ignoreDetached`, function () {
				objectCallback(this.o);
			}, taskOptions({ignoreDetached: true}))
			.add(`(${option.name}) empty Proxy`, function () {
				objectCallback(new Proxy(this.o, {}));
			}, simpleTaskOptions)
			.add(`(${option.name}) native ${separator}`, function () {
				objectCallback(this.o);
			}, simpleTaskOptions);
	}
};

await suite('on-change init with object', bench => {
	const object = buildObject(sizes[0].size);

	bench
		.add('new Proxy', () => {
			temporaryTarget = new Proxy(object, {});
		})
		.add('no options', () => {
			onChange(object, callback);
		})
		.add('pathAsArray', () => {
			onChange(object, callback, {pathAsArray: true});
		})
		.add('fat-arrow', () => {
			onChange(object, () => {});
		});
});

await suite('on-change with object, read', bench => {
	commonBench(bench, object => {
		temporaryTarget = object.a;
	});
});

await suite('on-change with object, read nested', bench => {
	commonBench(bench, object => {
		temporaryTarget = object.childObject.a;
	});
});

await suite('on-change with object, write', bench => {
	commonBench(bench, object => {
		object.a = value++;
	});
});

await suite('on-change with object, write nested', bench => {
	commonBench(bench, object => {
		object.childObject.a = value++;
	});
});

await suite('on-change with object, toString', bench => {
	commonBench(bench, object => {
		temporaryTarget = object.toString();
	});
});
