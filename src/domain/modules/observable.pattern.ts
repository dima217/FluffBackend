


export abstract class IObservable<T> {
	/**
	 * Accepts the data and processes it.
	 * @param data - The data to be processed.
	 */
	abstract accept(data: T): void;
}