/* globals suite benchmark */
import {benchSettings} from 'karma-webpack-bundle';
import onChange from '../index.js';

let temporaryTarget; // eslint-disable-line no-unused-vars
const callback = function () {};
let object = {};
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
			object = onChange(buildObject(option.size), callback);
		}));

		benchmark(`(${option.name}) isShallow`, bench, buildSettings(() => {
			object = onChange(buildObject(option.size), callback, {isShallow: true});
		}));

		benchmark(`(${option.name}) pathAsArray`, bench, buildSettings(() => {
			object = onChange(buildObject(option.size), callback, {pathAsArray: true});
		}));

		benchmark(`(${option.name}) ignoreSymbols`, bench, buildSettings(() => {
			object = onChange(buildObject(option.size), callback, {ignoreSymbols: true});
		}));

		benchmark(`(${option.name}) ignoreUnderscores`, bench, buildSettings(() => {
			object = onChange(buildObject(option.size), callback, {ignoreUnderscores: true});
		}));

		benchmark(`(${option.name}) ignoreDetached`, bench, buildSettings(() => {
			object = onChange(buildObject(option.size), callback, {ignoreDetached: true});
		}));

		benchmark(`(${option.name}) empty Proxy`, bench, buildSettings(() => {
			object = new Proxy(buildObject(option.size), {});
		}));

		benchmark(`(${option.name}) native ${separator}`, bench, buildSettings(() => {
			object = buildObject(option.size);
		}));
	}
};

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

suite('on-change init with object', () => {
	object = buildObject(sizes[0].size);

	benchmark('new Proxy', () => {
		temporaryTarget = new Proxy(object, {});
	}, benchSettings);

	benchmark('no options', () => {
		onChange(object, callback);
	}, benchSettings);

	benchmark('pathAsArray', () => {
		onChange(object, callback, {pathAsArray: true});
	}, benchSettings);

	benchmark('fat-arrow', () => {
		onChange(object, () => {});
	}, benchSettings);
});

suite('on-change with object, read', () => {
	commonBench(() => {
		temporaryTarget = object.a;
	});
});

suite('on-change with object, read nested', () => {
	commonBench(() => {
		temporaryTarget = object.childObject.a;
	});
});

suite('on-change with object, write', () => {
	commonBench(() => {
		object.a = value++;
	});
});

suite('on-change with object, write nested', () => {
	commonBench(() => {
		object.childObject.a = value++;
	});
});

suite('on-change with object, toString', () => {
	commonBench(() => {
		temporaryTarget = object.toString();
	});
});
