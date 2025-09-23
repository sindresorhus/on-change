import CloneObject from './clone-object.js';

export default class CloneWeakSet extends CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		super(undefined, path, argumentsList, hasOnValidate);

		this._argument1 = argumentsList[0];
		this._weakValue = value.has(this._argument1);
	}

	isChanged(value, _equals) {
		return this._weakValue !== value.has(this._argument1);
	}

	undo(object) {
		if (this._weakValue && !object.has(this._argument1)) {
			object.add(this._argument1);
		} else {
			object.delete(this._argument1);
		}
	}
}
