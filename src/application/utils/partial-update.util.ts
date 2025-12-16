/**
 * Utility function for partial updates
 * Applies only defined (non-undefined) values from source to target
 * @param target - Target object to update
 * @param source - Source object with partial updates
 * @returns Updated target object
 */
export function partialUpdate<T extends Record<string, any>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target };

	for (const key in source) {
		if (source[key] !== undefined) {
			result[key] = source[key] as T[Extract<keyof T, string>];
		}
	}

	return result;
}

