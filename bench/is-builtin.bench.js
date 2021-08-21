/* globals suite benchmark */
import {benchSettings} from 'karma-webpack-bundle';
import {isBuiltinWithMutableMethods, isBuiltinWithoutMutableMethods} from '../lib/is-builtin.js';

let temporaryTarget; // eslint-disable-line no-unused-vars

suite('isBuiltinWithMutableMethods', () => {
	const date = new Date();
	const notDate = 'a';

	benchmark('date', () => {
		temporaryTarget = isBuiltinWithMutableMethods(date);
	}, benchSettings);

	benchmark('not date', () => {
		temporaryTarget = isBuiltinWithMutableMethods(notDate);
	}, benchSettings);
});

suite('isBuiltinWithoutMutableMethods', () => {
	const testNaN = Number.NaN;
	const testRegExp = /as/g;
	const testString = 'a';
	const testNumber = 42;
	const testNumberInstance = Number(42);

	benchmark('NaN', () => {
		temporaryTarget = isBuiltinWithoutMutableMethods(testNaN);
	}, benchSettings);

	benchmark('regexp', () => {
		temporaryTarget = isBuiltinWithoutMutableMethods(testRegExp);
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = isBuiltinWithoutMutableMethods(testString);
	}, benchSettings);

	benchmark('number', () => {
		temporaryTarget = isBuiltinWithoutMutableMethods(testNumber);
	}, benchSettings);

	benchmark('number instance', () => {
		temporaryTarget = isBuiltinWithoutMutableMethods(testNumberInstance);
	}, benchSettings);
});
