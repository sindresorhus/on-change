import {HANDLED_SET_METHODS} from '../methods/set.js';
import CloneObject from './clone-object.js';

export default class CloneSet extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_SET_METHODS.has(name);
	}

	undo(object) {
		for (const value of this.clone) {
			object.add(value);
		}

		for (const value of object) {
			if (!this.clone.has(value)) {
				object.delete(value);
			}
		}
	}
}

