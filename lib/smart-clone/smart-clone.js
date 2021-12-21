import isArray from '../is-array.js';
import {isBuiltinWithMutableMethods} from '../is-builtin.js';
import isObject from '../is-object.js';
import CloneObject from './clone/clone-object.js';
import CloneArray from './clone/clone-array.js';
import CloneDate from './clone/clone-date.js';
import CloneSet from './clone/clone-set.js';
import CloneMap from './clone/clone-map.js';
import CloneWeakSet from './clone/clone-weakset.js';
import CloneWeakMap from './clone/clone-weakmap.js';

export default class SmartClone {
	constructor(hasOnValidate) {
		this._stack = [];
		this._hasOnValidate = hasOnValidate;
	}

	static isHandledType(value) {
		return isObject(value)
			|| isArray(value)
			|| isBuiltinWithMutableMethods(value);
	}

	static isHandledMethod(target, name) {
		if (isObject(target)) {
			return CloneObject.isHandledMethod(name);
		}

		if (isArray(target)) {
			return CloneArray.isHandledMethod(name);
		}

		if (target instanceof Set) {
			return CloneSet.isHandledMethod(name);
		}

		if (target instanceof Map) {
			return CloneMap.isHandledMethod(name);
		}

		return isBuiltinWithMutableMethods(target);
	}

	get isCloning() {
		return this._stack.length > 0;
	}

	start(value, path, argumentsList) {
		let CloneClass = CloneObject;

		if (isArray(value)) {
			CloneClass = CloneArray;
		} else if (value instanceof Date) {
			CloneClass = CloneDate;
		} else if (value instanceof Set) {
			CloneClass = CloneSet;
		} else if (value instanceof Map) {
			CloneClass = CloneMap;
		} else if (value instanceof WeakSet) {
			CloneClass = CloneWeakSet;
		} else if (value instanceof WeakMap) {
			CloneClass = CloneWeakMap;
		}

		this._stack.push(new CloneClass(value, path, argumentsList, this._hasOnValidate));
	}

	update(fullPath, property, value) {
		this._stack[this._stack.length - 1].update(fullPath, property, value);
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;
		const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, name);

		return this._stack[this._stack.length - 1]
			.preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget);
	}

	isChanged(isMutable, value, equals) {
		return this._stack[this._stack.length - 1].isChanged(isMutable, value, equals);
	}

	undo(object) {
		if (this._previousClone !== undefined) {
			this._previousClone.undo(object);
		}
	}

	stop() {
		this._previousClone = this._stack.pop();

		return this._previousClone.clone;
	}
}
