export default function isObject(value) {
	return toString.call(value) === '[object Object]';
}
