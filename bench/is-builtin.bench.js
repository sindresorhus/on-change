import {isBuiltinWithMutableMethods, isBuiltinWithoutMutableMethods} from '../lib/is-builtin.js';
import {suite} from './utils.js';

let temporaryTarget; // eslint-disable-line no-unused-vars

await suite('isBuiltinWithMutableMethods', bench => {
	const date = new Date();
	const notDate = 'a';

	bench
		.add('date', () => {
			temporaryTarget = isBuiltinWithMutableMethods(date);
		})
		.add('not date', () => {
			temporaryTarget = isBuiltinWithMutableMethods(notDate);
		});
});

await suite('isBuiltinWithoutMutableMethods', bench => {
	const testNaN = Number.NaN;
	const testRegExp = /as/g;
	const testString = 'a';
	const testNumber = 42;
	const testNumberInstance = Number(42);

	bench
		.add('NaN', () => {
			temporaryTarget = isBuiltinWithoutMutableMethods(testNaN);
		})
		.add('regexp', () => {
			temporaryTarget = isBuiltinWithoutMutableMethods(testRegExp);
		})
		.add('string', () => {
			temporaryTarget = isBuiltinWithoutMutableMethods(testString);
		})
		.add('number', () => {
			temporaryTarget = isBuiltinWithoutMutableMethods(testNumber);
		})
		.add('number instance', () => {
			temporaryTarget = isBuiltinWithoutMutableMethods(testNumberInstance);
		});
});
