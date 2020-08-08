const difference = (a, ...args) => {
	args.forEach(b => {
		a = a.filter(item => !b.includes(item));
	});

	return a;
};

const booleans = [
	true,
	false
];

const functions = [
	() => {},
	function () {},
	function test() {} // eslint-disable-line func-names
];

const numbers = [
	0,
	-0,
	1,
	12,
	Number(13),
	Infinity,
	-Infinity
];

const objects = [
	{},
	[]
];

const regExps = [
	new RegExp('regExp1'), // eslint-disable-line prefer-regex-literals
	RegExp('regExp2'), // eslint-disable-line unicorn/new-for-builtins, prefer-regex-literals
	/regExp3/
];

const strings = [
	String('string2'),
	'string3',
	'1',
	''
];

const dates = [
	new Date('1/1/2001')
];

const nots = [undefined, null, Number.NaN];

const testValues = nots.concat(
	booleans,
	functions,
	numbers,
	objects,
	regExps,
	strings,
	dates
);

module.exports = {
	difference,
	booleans,
	functions,
	numbers,
	objects,
	regExps,
	strings,
	dates,
	nots,
	testValues
};
