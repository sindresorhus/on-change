'use strict';

module.exports = (object, onChange) => {
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
			onChange();
			return result;
		},
		deleteProperty(target, property) {
			const result = Reflect.deleteProperty(target, property);
			onChange();
			return result;
		}
	};

	return new Proxy(object, handler);
};
