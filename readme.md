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
const watchedObject = onChange(object, function (path, value, previousValue) {
	console.log('Object changed:', ++i);
	console.log('this:', this);
	console.log('path:', path);
	console.log('value:', value);
	console.log('previousValue:', previousValue);
});

watchedObject.foo = true;
//=> 'Object changed: 1'
//=> 'this: {
//   	foo: true,
//   	a: {
//   		b: [
//   			{
//   				c: false
//   			}
//   		]
//   	}
//   }'
//=> 'path: "foo"'
//=> 'value: true'
//=> 'previousValue: false'

watchedObject.a.b[0].c = true;
//=> 'Object changed: 2'
//=> 'this: {
//   	foo: true,
//   	a: {
//   		b: [
//   			{
//   				c: true
//   			}
//   		]
//   	}
//   }'
//=> 'path: "a.b.0.c"'
//=> 'value: true'
//=> 'previousValue: false'

// Access the original object
watchedObject['[[target]]'].foo = false;
// Callback isn't called

// Unsubscribe
watchedObject['[[unsubscribe]]']();
watchedObject.foo = 'bar';
// Callback isn't called
```


## API

### onChange(object, onChange, [options])

Returns a version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.

A hidden readonly property `[[target]]` on the returned object will return the original `object`.

A hidden readonly method `[[unsubscribe]]` on the returned object will cancel all future callbacks.

#### object

Type: `object`

Object to watch for changes.

#### onChange

Type: `Function`

Function that gets called anytime the object changes.

The function receives three arguments:
1. A path to the value that was changed. A change to `c` in the above example would return `a.b.0.c`.
2. The new value at the path.
3. The previous value at the path.

The context (this) is set to the original object passed to `onChange` (with Proxy).

#### options

Type: `object`

##### isShallow

Type: `boolean`<br>
Default: `false`

Deep changes will not trigger the callback. Only changes to the immediate properties of the original object.

##### equals

Type: `Function`<br>
Default: [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) ([SameValue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#Same-value_equality) equality)

The function receives two arguments, the two values to be compared for equality. True should be returned if the two values are determined to be equal.


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
- [statux](https://github.com/franciscop/state) - State manager *(Uses `Proxy` too)*
- [introspected](https://github.com/WebReflection/introspected) - Never-ending Proxy with multiple observers *(Uses `Proxy` too)*


## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Darren Wright](https://github.com/DarrenPaulWright)
