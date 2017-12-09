# on-change [![Build Status](https://travis-ci.org/sindresorhus/on-change.svg?branch=master)](https://travis-ci.org/sindresorhus/on-change)

> Watch an object or array for changes

It works recursively, so it will even detect if you modify a deep property like `obj.a.b[0].c = true`.

Uses the [`Proxy` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).


## Install

```
$ npm install on-change
```


## Usage

```js
const onChange = require('on-change');

const object = {
	foo: false,
	a: {
		b: [
			{
				c: false
			}
		]
	}
};

let i = 0;
const watchedObject = onChange(object, () => {
	console.log('Object changed:', i);
});

watchedObject.foo = true;
//=> 'Object changed: 1'

watchedObject.a.b[0].c = true;
//=> 'Object changed: 2'
```


## API

### onChange(object, onChange)

Returns a version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.

#### object

Type: `Object`

Object to watch for changes.

#### onChange

Type: `Function`

Function that gets called anytime the object changes.


## Use-case

I had some code that was like:

```js
const foo = {
	a: 0,
	b: 0
};

// …

foo.a = 3;
save(foo);

// …

foo.b = 7;
save(foo);


// …

foo.a = 10;
save(foo);
```

Now it can be simplified to:

```js
const foo = onChange({
	a: 0,
	b: 0
}, () => save(foo));

// …

foo.a = 3;

// …

foo.b = 7;

// …

foo.a = 10;
```


## Related

- [known](https://github.com/sindresorhus/known) - Allow only access to known object properties *(Uses `Proxy` too)*
- [negative-array](https://github.com/sindresorhus/negative-array) - Negative array index support `array[-1]` *(Uses `Proxy` too)*


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
