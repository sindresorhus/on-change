export interface Options {
	/**
	Deep changes will not trigger the callback. Only changes to the immediate properties of the original object.

	@default false

	@example
	```
	import onChange from 'on-change';

	const object = {
		a: {
			b: false
		}
	};

	let index = 0;
	const watchedObject = onChange(object, () => {
		console.log('Object changed:', ++index);
	}, {isShallow: true});

	watchedObject.a.b = true;
	// Nothing happens

	watchedObject.a = true;
	//=> 'Object changed: 1'
	```
	*/
	readonly isShallow?: boolean;

	/**
	The function receives two arguments to be compared for equality. Should return `true` if the two values are determined to be equal.

	@default Object.is

	@example
	 ```
	import onChange from 'on-change';

	const object = {
		a: {
			b: false
		}
	};

	let index = 0;
	const watchedObject = onChange(object, () => {
		console.log('Object changed:', ++index);
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
	readonly ignoreSymbols?: boolean;

	/**
	Setting properties in this array won't trigger the callback.

	@default undefined
	*/
	readonly ignoreKeys?: ReadonlyArray<string | symbol>;

	/**
	Setting properties with an underscore as the first character won't trigger the callback.

	@default false
	*/
	readonly ignoreUnderscores?: boolean;

	/**
	The path will be provided as an array of keys instead of a delimited string.

	@default false
	*/
	readonly pathAsArray?: boolean;

	/**
	Ignore changes to objects that become detached from the watched object.

	@default false
	*/
	readonly ignoreDetached?: boolean;

	/**
	Trigger callbacks for each change within specified method calls or all method calls.

	@default false
	 */
	readonly details?: boolean | readonly string[];

	/**
	The function receives the same arguments and context as the [onChange callback](#onchange). The function is called whenever a change is attempted. Returning true will allow the change to be made and the onChange callback to execute, returning anything else will prevent the change from being made and the onChange callback will not trigger.

	@example
	 ```
	import onChange from 'on-change';

	const object = {a: 0};
	let index = 0;
	const watchedObject = onChange(object, () => {
		console.log('Object changed:', ++index);
	}, {onValidate: () => false});

	watchedObject.a = true;
	// watchedObject.a still equals 0
	```
	 */
	onValidate?: (
		this: unknown,
		path: string,
		value: unknown,
		previousValue: unknown,
		applyData: ApplyData
	) => boolean;
}

export interface ApplyData {
	/**
	The name of the method that produced the change.
	*/
	readonly name: string;

	/**
	The arguments provided to the method that produced the change.
	*/
	readonly args: unknown[];

	/**
	The result returned from the method that produced the change.
	*/
	readonly result: unknown;
}

declare const onChange: {
	/**
	Watch an object or array for changes. It works recursively, so it will even detect if you modify a deep property like `obj.a.b[0].c = true`.

	@param object - Object to watch for changes.
	@param onChange - Function that gets called anytime the object changes.
	@param [options] - Options for altering the behavior of onChange.
	@returns A version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.

	@example
	```
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
	*/
	<ObjectType extends Record<string, any>>(
		object: ObjectType,
		onChange: (
			this: ObjectType,
			path: string,
			value: unknown,
			previousValue: unknown,
			applyData: ApplyData
		) => void,
		options?: Options & {pathAsArray?: false}
	): ObjectType;

	// Overload that returns a string array as path when `ignoreSymbols` and `pathAsArray` options are true.
	<ObjectType extends Record<string, any>>(
		object: ObjectType,
		onChange: (
			this: ObjectType,
			path: string[],
			value: unknown,
			previousValue: unknown,
			applyData: ApplyData
		) => void,
		options: Options & {ignoreSymbols: true; pathAsArray: true}
	): ObjectType;

	// Overload that returns an array as path when `pathAsArray` option is true.
	<ObjectType extends Record<string, any>>(
		object: ObjectType,
		onChange: (
			this: ObjectType,
			path: Array<string | symbol>,
			value: unknown,
			previousValue: unknown,
			applyData: ApplyData
		) => void,
		options: Options & {pathAsArray: true}
	): ObjectType;

	/**
	@param object - Object that is already being watched for changes.
	@returns The original unwatched object.
	*/
	target<ObjectType extends Record<string, any>>(object: ObjectType): ObjectType;

	/**
	Cancels all future callbacks on a watched object.

	@param object - Object that is already being watched for changes.
	@returns The original unwatched object.
	*/
	unsubscribe<ObjectType extends Record<string, any>>(object: ObjectType): ObjectType;
};

export default onChange;
