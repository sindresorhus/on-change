export default function isIterator(value) {
	return value !== null
		&& typeof value === 'object'
		&& typeof value.next === 'function';
}
