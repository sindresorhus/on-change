import {TARGET} from './constants.js';

// eslint-disable-next-line max-params
export default function wrapIterator(iterator, target, thisArg, applyPath, prepareValue) {
	const originalNext = iterator.next;

	if (target.name === 'entries') {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value[0] = prepareValue(
					result.value[0],
					target,
					result.value[0],
					applyPath,
				);
				result.value[1] = prepareValue(
					result.value[1],
					target,
					result.value[0],
					applyPath,
				);
			}

			return result;
		};
	} else if (target.name === 'values') {
		const keyIterator = thisArg[TARGET].keys();

		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					keyIterator.next().value,
					applyPath,
				);
			}

			return result;
		};
	} else {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					result.value,
					applyPath,
				);
			}

			return result;
		};
	}

	return iterator;
}
