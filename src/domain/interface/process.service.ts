


export interface IProcessService<T> {
	execute(data: T): Promise<void>;
}