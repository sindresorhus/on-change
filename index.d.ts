/**
 * Watch an object or array for changes. It works recursively, so it will even detect if you modify a deep property like `obj.a.b[0].c = true`.
 *
 * @param object - Object to watch for changes.
 * @param onChange - Function that gets called anytime the object changes.
 * @returns A version of `object` that is watched. It's the exact same object, just with some `Proxy` traps.
 */
export default function onChange<ObjectType extends {[key: string]: unknown}>(
	object: ObjectType,
	onChange: (this: ObjectType, path: string, value: unknown, previousValue: unknown) => void
): ObjectType;
