export default function isDiffMaps(clone, value) {
	if (clone === value) {
		return false;
	}

	if (clone.size !== value.size) {
		return true;
	}

	for (const [key, aValue] of clone) {
		const bValue = value.get(key);
		// Distinguish missing vs undefined and catch strict inequality
		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
			return true;
		}
	}

	return false;
}
