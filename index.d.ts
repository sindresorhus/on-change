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
		readonly isShallow?: boolean;
		/**
		 A function that should return a clone of a value. Enables the "previous" value in the onChange callback when array methods are called.
		*/
		readonly clone?: Function;
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
	```
	*/
	<ObjectType extends {[key: string]: unknown}>(
		object: ObjectType,
		onChange: (
			this: ObjectType,
			path: string,
			value: unknown,
			previousValue: unknown
		) => void,
		options?: onChange.Options
	): ObjectType;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function onChange<ObjectType extends {[key: string]: unknown}>(
	// 	object: ObjectType,
	// 	onChange: (this: ObjectType, path: string, value: unknown, previousValue: unknown) => void
	// ): ObjectType;
	// export = onChange;
	default: typeof onChange;
};

export = onChange;
