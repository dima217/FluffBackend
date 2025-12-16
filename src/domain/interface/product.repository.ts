import { Product } from '@domain/entities/product.entity';

export interface IProductRepository {
	create(product: Product): Promise<Product>;
	findOne(id: number): Promise<Product>;
	findAll(): Promise<Product[]>;
	findByIds(ids: number[]): Promise<Product[]>;
	update(id: number, product: Partial<Product>): Promise<Product>;
	delete(id: number): Promise<void>;
}

