export default function isIterator(value) {
	return typeof value === 'object' && typeof value.next === 'function';
}
