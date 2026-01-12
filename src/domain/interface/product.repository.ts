import { Product } from '@domain/entities/product.entity';

export interface PaginationOptions {
	page: number;
	limit: number;
}

export interface PaginationResult<T> {
	data: T[];
	total: number;
}

export interface IProductRepository {
	create(product: Product): Promise<Product>;
	findOne(id: number): Promise<Product>;
	findAll(options?: PaginationOptions): Promise<PaginationResult<Product>>;
	findByIds(ids: number[]): Promise<Product[]>;
	searchByName(searchTerm: string, exactMatch?: boolean): Promise<Product[]>;
	update(id: number, product: Partial<Product>): Promise<Product>;
	delete(id: number): Promise<void>;
}

