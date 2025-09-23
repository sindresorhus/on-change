import {HANDLED_ARRAY_METHODS} from '../methods/array.js';
import CloneObject from './clone-object.js';

export default class CloneArray extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_ARRAY_METHODS.has(name);
	}
}
