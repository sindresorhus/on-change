/* globals suite benchmark */
'use strict';

const isBuiltin = require('../lib/is-builtin');
const {benchSettings} = require('karma-webpack-bundle');

let temporaryTarget; // eslint-disable-line no-unused-vars

suite('isBuiltin.primitive', () => {
	const object = {};
	const func = () => {};

	benchmark('null', () => {
		temporaryTarget = isBuiltin.primitive(null);
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = isBuiltin.primitive('a');
	}, benchSettings);

	benchmark('object', () => {
		temporaryTarget = isBuiltin.primitive(object);
	}, benchSettings);

	benchmark('function', () => {
		temporaryTarget = isBuiltin.primitive(func);
	}, benchSettings);
});

suite('isBuiltin.withMutableMethods', () => {
	const date = new Date();
	const notDate = 'a';

	benchmark('date', () => {
		temporaryTarget = isBuiltin.withMutableMethods(date);
	}, benchSettings);

	benchmark('not date', () => {
		temporaryTarget = isBuiltin.withMutableMethods(notDate);
	}, benchSettings);
});

suite('isBuiltin.withoutMutableMethods', () => {
	const testNaN = NaN;
	const testRegExp = /as/g;
	const testString = 'a';
	const testNumber = 42;
	const testNumberInstance = Number(42);

	benchmark('NaN', () => {
		temporaryTarget = isBuiltin.withoutMutableMethods(testNaN);
	}, benchSettings);

	benchmark('regexp', () => {
		temporaryTarget = isBuiltin.withoutMutableMethods(testRegExp);
	}, benchSettings);

	benchmark('string', () => {
		temporaryTarget = isBuiltin.withoutMutableMethods(testString);
	}, benchSettings);

	benchmark('number', () => {
		temporaryTarget = isBuiltin.withoutMutableMethods(testNumber);
	}, benchSettings);

	benchmark('number instance', () => {
		temporaryTarget = isBuiltin.withoutMutableMethods(testNumberInstance);
	}, benchSettings);
});
