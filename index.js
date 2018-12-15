'use strict';

const BLACKLIST = [
	'sort',
	'reverse',
	'splice',
	'pop',
	'unshift',
	'shift',
	'push'
];
module.exports = (object, onChange) => {
	let blocked = false;
	const handler = {
		get(target, property, receiver) {
			try {
				return new Proxy(target[property], handler);
			} catch (_) {
				return Reflect.get(target, property, receiver);
			}
		},
		defineProperty(target, property, descriptor) {
			const result = Reflect.defineProperty(target, property, descriptor);

			if (!blocked) {
				onChange();
			}

			return result;
		},
		deleteProperty(target, property) {
			const result = Reflect.deleteProperty(target, property);

			if (!blocked) {
				onChange();
			}

			return result;
		},
		apply(target, thisArg, argumentsList) {
			if (BLACKLIST.includes(target.name)) {
				blocked = true;
				const result = Reflect.apply(target, thisArg, argumentsList);
				onChange();
				blocked = false;
				return result;
			}
			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	return new Proxy(object, handler);
};
