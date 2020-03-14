declare namespace onChange {
	interface Options {
		/**
		Deep changes will not trigger the callback. Only changes to the immediate properties of the original object.

		@default false

		@example
		```
		import onChange = require('on-change');

		const object = {
			a: {
				b: false
			}
		};

		let i = 0;
		const watchedObject = onChange(object, () => {
			console.log('Object changed:', ++i);
		}, {isShallow: true});

		watchedObject.a.b = true;
		// Nothing happens

		watchedObject.a = true;
		//=> 'Object changed: 1'
		```
		*/
		isShallow?: boolean;

		/**
		The function receives two arguments to be compared for equality. Should return `true` if the two values are determined to be equal.

		@default Object.is

		@example
		 ```
		import onChange = require('on-change');

		const object = {
			a: {
				b: false
			}
		};

		let i = 0;
		const watchedObject = onChange(object, () => {
			console.log('Object changed:', ++i);
		}, {equals: (a, b) => a === b});

		watchedObject.a.b = 0;
		// Nothing happens

		watchedObject.a = true;
		//=> 'Object changed: 1'
		```
		*/
		equals?: (a: unknown, b: unknown) => boolean;

		/**
		Setting properties as `Symbol` won't trigger the callback.

		@default false
		*/
		ignoreSymbols?: boolean;

		/**
		Setting properties in this array won't trigger the callback.

		@default undefined
		*/
		ignoreKeys?: Array<string|symbol>;

		/**
		Setting properties with an underscore as the first character won't trigger the callback.

		@default false
		*/
		ignoreUnderscores?: boolean;

		/**
		The path will be provided as an array of keys instead of a delimited string.

		@default false
		*/
		pathAsArray?: boolean;
	}
}

declare const onChange: {
	/**
	Watch an object or array for changes. It works recursively, so it will even detect if you modify a deep property like `obj.a.b[0].c = true`.

	@param object - Object to watch for changes.
	@param onChange - Function that gets called anytime the object changes.
	@returns A version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.

	@example
	```
	import onChange = require('on-change');

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
	onChange.target(watchedObject).foo = false;
	// Callback isn't called

	// Unsubscribe
	onChange.unsubscribe(watchedObject);
	watchedObject.foo = 'bar';
	// Callback isn't called
	```
	*/
	<ObjectType extends {[key: string]: any}>(
		object: ObjectType,
		onChange: (
			this: ObjectType,
			path: string,
			value: unknown,
			previousValue: unknown
		) => void,
		options?: onChange.Options
	): ObjectType;

	/**
	@param object - Object that is already being watched for changes.
	@returns The original unwatched object.
	*/
	target<ObjectType extends {[key: string]: any}>(object: ObjectType): ObjectType;

	/**
	Cancels all future callbacks on a watched object.

	@param object - Object that is already being watched for changes.
	@returns The original unwatched object.
	*/
	unsubscribe<ObjectType extends {[key: string]: any}>(object: ObjectType): ObjectType;
};

export = onChange;
