export default function isDiffArrays(clone, value) {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
}
