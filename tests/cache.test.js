/* eslint-disable max-depth */
import test from 'ava';
import powerset from 'powerset';
import displayValue from 'display-value';
import Cache from '../lib/cache.js';

test('should delete inner WeakMaps when unsubscribe is called', t => {
	const cache = new Cache();

	t.is(cache._descriptorCache instanceof WeakMap, false);
	t.is(cache._pathCache instanceof WeakMap, true);
	t.is(cache._proxyCache instanceof WeakMap, true);
	t.is(cache.isUnsubscribed, false);

	cache.unsubscribe();

	t.is(cache._descriptorCache, null);
	t.is(cache._pathCache, null);
	t.is(cache._proxyCache, null);
	t.is(cache.isUnsubscribed, true);
});

test('should get a proxy and set a path', t => {
	const cache = new Cache();
	const object = {
		a: 1,
	};
	const handlerMock = {
		get() {
			return 'proxy';
		},
	};
	const proxy1 = cache.getProxy(object, '', handlerMock);

	t.not(proxy1, object);
	t.is(proxy1.a, 'proxy');
	t.is(cache.getPath(object), '');

	const proxy2 = cache.getProxy(object, '', handlerMock);

	t.not(proxy2, object);
	t.is(proxy2, proxy1);
	t.is(proxy2.a, 'proxy');
	t.is(cache.getPath(object), '');

	cache.unsubscribe();

	const proxy3 = cache.getProxy(object, '', handlerMock);

	t.is(proxy3, object);
	t.is(proxy2, proxy1);
	t.is(proxy2.a, 'proxy');
	t.is(cache.getPath(object), undefined);
});

test('should get a descriptor', t => {
	const cache = new Cache();
	const object = {
		a: 1,
		b: {
			c: 2,
		},
	};
	const descriptor1 = cache._getOwnPropertyDescriptor(object, 'a');

	t.is(descriptor1.value, 1);
	t.is(cache._descriptorCache.get(object).constructor, Object);
	t.is(cache._descriptorCache.get(object).a, descriptor1);

	const descriptor2 = cache._getOwnPropertyDescriptor(object, 'a');

	t.is(descriptor1, descriptor2);
	t.is(cache._descriptorCache.get(object).a, descriptor1);

	const descriptor3 = cache._getOwnPropertyDescriptor(object, 'b');

	t.is(descriptor3.value, object.b);
	t.is(cache._descriptorCache.get(object).constructor, Object);
	t.is(cache._descriptorCache.get(object).a, descriptor1);
	t.is(cache._descriptorCache.get(object).b, descriptor3);

	const descriptor4 = {};
	cache.defineProperty(object, 'a', descriptor4);
	t.is(cache._getOwnPropertyDescriptor(object, 'a'), descriptor4);

	cache.getProxy(object.b, 'b', {});

	t.is(cache.getPath(object.b), 'b');

	cache.deleteProperty(object, 'b', object.b);

	t.is(cache.getPath(object.b), undefined);
	t.is(cache._descriptorCache.get(object).a, descriptor4);
	t.is(cache._descriptorCache.get(object).b, undefined);

	cache.unsubscribe();

	const descriptor5 = cache._getOwnPropertyDescriptor(object, 'a');

	t.is(descriptor5.value, 1);
	t.not(descriptor5, descriptor1);

	t.notThrows(() => {
		cache.deleteProperty(object, 'b', object.b);
	});
});

const noop1 = () => {};
const noop2 = function () {};

const keysToObject = value => keys => {
	const result = {};

	for (const key of keys) {
		result[key] = value;
	}

	return result;
};

const descriptorKeyVariants = powerset(['configurable', 'enumerable', 'writable']);
const descriptorSet = descriptorKeyVariants.map(keysToObject(true));
const setterSet = powerset(['get', 'set']).map(keysToObject(noop1));
const compiledSettings = [];
const titles = [];

for (const descriptorOptions of descriptorSet) {
	for (const setterOptions of setterSet) {
		const hasGetterSetter = Object.entries(setterOptions).length > 0;

		if (!hasGetterSetter || descriptorOptions.writable === undefined) {
			const settings = {
				...descriptorOptions,
				...setterOptions,
			};

			if (!hasGetterSetter) {
				settings.value = 1;
			}

			compiledSettings.push(settings);
		}
	}
}

for (const [index1, settings1] of compiledSettings.entries()) {
	for (const [index2, settings2] of compiledSettings.entries()) {
		const object = {};
		const cache = new Cache();

		Object.defineProperty(object, 'a', settings1);

		if (index1 === index2) {
			test(`should return true when isSameDescriptor is provided ${displayValue(settings1)} twice`, t => {
				t.is(cache.isSameDescriptor(settings2, object, 'a'), true);
			});

			if (settings2.get !== undefined) {
				const settings = {
					...settings2,
					get: noop2,
				};

				test(`should return false when isSameDescriptor is comparing ${displayValue(settings1)} and ${displayValue(settings)}`, t => {
					t.is(cache.isSameDescriptor(settings, object, 'a'), false);
				});
			}

			if (settings2.set !== undefined) {
				const settings = {
					...settings2,
					set: noop2,
				};

				test(`should return false when isSameDescriptor is comparing ${displayValue(settings1)} and ${displayValue(settings)}`, t => {
					t.is(cache.isSameDescriptor(settings, object, 'a'), false);
				});
			}
		} else {
			for (const variant of descriptorKeyVariants) {
				if (variant.some(key => !settings2[key])) {
					const finalSettings = {
						...keysToObject(false)(variant),
						...settings2,
					};
					const title = `should return false when isSameDescriptor is comparing ${displayValue(settings1)} and ${displayValue(finalSettings)}`;

					if (!titles.includes(title)) {
						test(title, t => {
							t.is(cache.isSameDescriptor(finalSettings, object, 'a'), false);
						});

						titles.push(title);
					}
				}
			}
		}
	}
}
