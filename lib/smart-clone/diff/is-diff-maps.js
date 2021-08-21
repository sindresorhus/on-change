export default function isDiffMaps(clone, value) {
	if (clone.size !== value.size) {
		return true;
	}

	let bValue;
	for (const [key, aValue] of clone) {
		bValue = value.get(key);

		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
			return true;
		}
	}

	return false;
}
