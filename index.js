'use strict';

module.exports = (object, onChange) => {
	const handler = {
		get(target, property, receiver) {
			try {
				return new Proxy(target[property], handler);
			} catch (err) {
				return Reflect.get(target, property, receiver);
			}
		},
		defineProperty(target, property, descriptor) {
			onChange();
			return Reflect.defineProperty(target, property, descriptor);
		},
		deleteProperty(target, property) {
			onChange();
			return Reflect.deleteProperty(target, property);
		}
	};

	return new Proxy(object, handler);
};
