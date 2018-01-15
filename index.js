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
			} catch (err) {
				return Reflect.get(target, property, receiver);
			}
		},
		defineProperty(target, property, descriptor) {
			if (!blocked) {
				onChange();
			}
			return Reflect.defineProperty(target, property, descriptor);
		},
		deleteProperty(target, property) {
			if (!blocked) {
				onChange();
			}
			return Reflect.deleteProperty(target, property);
		},
		apply(target, thisArg, argumentsList) {
			if (BLACKLIST.includes(target.name)) {
				blocked = true;
				const result = target.call(thisArg, argumentsList);
				onChange();
				blocked = false;
				return result;
			}
			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	return new Proxy(object, handler);
};
