# on-change

> Watch an object or array for changes

It works recursively, so it will even detect if you modify a deep property like `obj.a.b[0].c = true`.

Uses the [`Proxy` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

## Install

```sh
npm install on-change
```

## Usage

```js
import onChange from 'on-change';

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

let index = 0;
const watchedObject = onChange(object, function (path, value, previousValue, applyData) {
	console.log('Object changed:', ++index);
	console.log('this:', this);
	console.log('path:', path);
	console.log('value:', value);
	console.log('previousValue:', previousValue);
	console.log('applyData:', applyData);
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
//=> 'applyData: undefined'

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
//=> 'applyData: undefined'

watchedObject.a.b.push(3);
//=> 'Object changed: 3'
//=> 'this: {
//   	foo: true,
//   	a: {
//   		b: [
//   			{
//   				c: true
//   			},
//   			3
//   		]
//   	}
//   }'
//=> 'path: "a.b"'
//=> 'value: [{c: true}, 3]'
//=> 'previousValue: [{c: true}]'
//=> 'applyData: {
//       name: "push",
//       args: [3],
//       result: 2,
//   }'

// Access the original object
onChange.target(watchedObject).foo = false;
// Callback isn't called

// Unsubscribe
onChange.unsubscribe(watchedObject);
watchedObject.foo = 'bar';
// Callback isn't called
```

## API

### onChange(object, onChange, options?)

Returns a version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.

#### object

Type: `object`

Object to watch for changes.

#### onChange

Type: `Function`

Function that gets called anytime the object changes.

The function receives four arguments:
1. A path to the value that was changed. A change to `c` in the above example would return `a.b.0.c`.
2. The new value at the path.
3. The previous value at the path. Changes in `WeakSets` and `WeakMaps` will return `undefined`.
4. An object with the name of the method that produced the change, the args passed to the method, and the result of the method.

The context (this) is set to the original object passed to `onChange` (with Proxy).

#### options

Type: `object`

Options for altering the behavior of onChange.

##### isShallow

Type: `boolean`\
Default: `false`

Deep changes will not trigger the callback. Only changes to the immediate properties of the original object.

##### equals

Type: `Function`\
Default: [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

The function receives two arguments to be compared for equality. Should return `true` if the two values are determined to be equal. Useful if you only need a more loose form of equality.

##### ignoreSymbols

Type: `boolean`\
Default: `false`

Setting properties as `Symbol` won't trigger the callback.

##### ignoreKeys

Type: `Array<string | symbol>`\
Default: `undefined`

Setting properties in this array won't trigger the callback.

##### ignoreUnderscores

Type: `boolean`\
Default: `false`

Setting properties with an underscore as the first character won't trigger the callback.

##### pathAsArray

Type: `boolean`\
Default: `false`

The path will be provided as an array of keys instead of a delimited string. Recommended when working with Sets, Maps, or property keys that are Symbols.

##### ignoreDetached

Type: `boolean`\
Default: `false`

Ignore changes to objects that become detached from the watched object.

##### details

Type: `boolean|string[]`\
Default: `false`

Trigger callbacks for each change within specified method calls or all method calls.

##### onValidate

Type: `Function`

The function receives the same arguments and context as the [onChange callback](#onchange). The function is called whenever a change is attempted. Returning true will allow the change to be made and the onChange callback to execute, returning anything else will prevent the change from being made and the onChange callback will not trigger.

<br>

### onChange.target(object)

Returns the original unwatched object.

#### object

Type: `object`

Object that is already being watched for changes.

### onChange.unsubscribe(object)

Cancels all future callbacks on a watched object and returns the original unwatched object.

#### object

Type: `object`

Object that is already being watched for changes.

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
- [atama](https://github.com/franciscop/atama) - State manager *(Uses `Proxy` too)*
- [introspected](https://github.com/WebReflection/introspected) - Never-ending Proxy with multiple observers *(Uses `Proxy` too)*

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Darren Wright](https://github.com/DarrenPaulWright)
