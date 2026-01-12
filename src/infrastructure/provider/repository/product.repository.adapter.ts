import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from '@domain/entities/product.entity';
import { IProductRepository } from '@domain/interface/product.repository';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ProductRepositoryAdapter implements IProductRepository {
	private repository: Repository<Product>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Product);
	}

	async create(product: Product): Promise<Product> {
		const newProduct = this.repository.create(product);
		return await this.repository.save(newProduct);
	}

	async findOne(id: number): Promise<Product> {
		const product = await this.repository.findOne({ where: { id } });
		if (!product) {
			throw new NotFoundEntityException('Product');
		}
		return product;
	}

	async findAll(options?: { page: number; limit: number }): Promise<{ data: Product[]; total: number }> {
		if (!options) {
			// If no pagination options provided, return all products (backward compatibility)
			const data = await this.repository.find();
			return { data, total: data.length };
		}

		const { page, limit } = options;
		const skip = (page - 1) * limit;

		const [data, total] = await this.repository.findAndCount({
			skip,
			take: limit,
		});

		return { data, total };
	}

	async findByIds(ids: number[]): Promise<Product[]> {
		if (ids.length === 0) {
			return [];
		}
		return await this.repository.find({
			where: ids.map((id) => ({ id })),
		});
	}

	async searchByName(searchTerm: string, exactMatch: boolean = false): Promise<Product[]> {
		if (!searchTerm || searchTerm.trim().length === 0) {
			return [];
		}
		const trimmedTerm = searchTerm.trim();
		if (exactMatch) {
			return await this.repository.find({
				where: { name: trimmedTerm },
			});
		}
		return await this.repository
			.createQueryBuilder('product')
			.where('LOWER(product.name) LIKE LOWER(:searchTerm)', {
				searchTerm: `%${trimmedTerm}%`,
			})
			.getMany();
	}

	async update(id: number, product: Partial<Product>): Promise<Product> {
		const existingProduct = await this.findOne(id);
		Object.assign(existingProduct, product);
		return await this.repository.save(existingProduct);
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.repository.delete(id);
	}
}

