export default function isDiffSets(clone, value) {
	if (clone === value) {
		return false;
	}

	if (clone.size !== value.size) {
		return true;
	}

	for (const element of clone) {
		if (!value.has(element)) {
			return true;
		}
	}

	return false;
}
