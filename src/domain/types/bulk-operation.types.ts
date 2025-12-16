export interface BulkOperationResult<T> {
	success: number;
	failed: number;
	total: number;
	results: T[];
}

