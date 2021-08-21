import CloneObject from './clone-object.js';

export default class CloneWeakSet extends CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		super(undefined, path, argumentsList, hasOnValidate);

		this._arg1 = argumentsList[0];
		this._weakValue = value.has(this._arg1);
	}

	isChanged(value) {
		return this._weakValue !== value.has(this._arg1);
	}

	undo(object) {
		if (this._weakValue && !object.has(this._arg1)) {
			object.add(this._arg1);
		} else {
			object.delete(this._arg1);
		}
	}
}

