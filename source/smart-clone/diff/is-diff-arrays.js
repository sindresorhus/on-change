export default function isDiffArrays(clone, value) {
	if (clone === value) {
		return false;
	}

	return clone.length !== value.length
		|| clone.some((item, index) => value[index] !== item);
}
