import {PATH_SEPARATOR} from './constants.js';
import isSymbol from './is-symbol.js';

const path = {
	after(path, subPath) {
		if (Array.isArray(path)) {
			return path.slice(subPath.length);
		}

		if (subPath === '') {
			return path;
		}

		return path.slice(subPath.length + 1);
	},
	concat(path, key) {
		if (Array.isArray(path)) {
			path = [...path];

			if (key) {
				path.push(key);
			}

			return path;
		}

		if (key && key.toString !== undefined) {
			if (path !== '') {
				path += PATH_SEPARATOR;
			}

			if (isSymbol(key)) {
				return path + key.toString();
			}

			return path + key;
		}

		return path;
	},
	initial(path) {
		if (Array.isArray(path)) {
			return path.slice(0, -1);
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return '';
		}

		return path.slice(0, index);
	},
	last(path) {
		if (Array.isArray(path)) {
			return path.at(-1) ?? '';
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return path;
		}

		return path.slice(index + 1);
	},
	walk(path, callback) {
		if (Array.isArray(path)) {
			for (const key of path) {
				callback(key);
			}
		} else if (path !== '') {
			let position = 0;
			let index = path.indexOf(PATH_SEPARATOR);

			if (index === -1) {
				callback(path);
			} else {
				while (position < path.length) {
					if (index === -1) {
						index = path.length;
					}

					callback(path.slice(position, index));

					position = index + 1;
					index = path.indexOf(PATH_SEPARATOR, position);
				}
			}
		}
	},
	get(object, path) {
		this.walk(path, key => {
			object &&= object[key];
		});

		return object;
	},
	isSubPath(path, subPath) {
		if (Array.isArray(path)) {
			if (path.length < subPath.length) {
				return false;
			}

			// eslint-disable-next-line unicorn/no-for-loop
			for (let i = 0; i < subPath.length; i++) {
				if (path[i] !== subPath[i]) {
					return false;
				}
			}

			return true;
		}

		if (path.length < subPath.length) {
			return false;
		}

		if (path === subPath) {
			return true;
		}

		if (path.startsWith(subPath)) {
			return path[subPath.length] === PATH_SEPARATOR;
		}

		return false;
	},
	isRootPath(path) {
		if (Array.isArray(path)) {
			return path.length === 0;
		}

		return path === '';
	},
};

export default path;
