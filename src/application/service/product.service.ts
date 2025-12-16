import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { IProductService } from '@application/interface/service/product.service';
import type { IProductRepository } from '@domain/interface/product.repository';
import type { IFavoriteRepository } from '@domain/interface/favorite.repository';
import { Product } from '@domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '@application/dto/product.dto';
import { ProductMapper } from '@application/mapper/product.mapper';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ProductService implements IProductService {
	private readonly logger = new Logger(ProductService.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.PRODUCT_REPOSITORY)
		private readonly productRepository: IProductRepository,
		@Inject(REPOSITORY_CONSTANTS.FAVORITE_REPOSITORY)
		private readonly favoriteRepository: IFavoriteRepository,
	) { }

	async create(createDto: CreateProductDto): Promise<Product> {
		this.logger.log(`Creating product: ${createDto.name}`);
		const product = ProductMapper.toEntity(createDto);
		return await this.productRepository.create(product);
	}

	async findOne(id: number, userId?: number | null): Promise<Product> {
		this.logger.log(`Finding product with ID: ${id}`);
		return await this.productRepository.findOne(id);
	}

	async findAll(userId?: number | null): Promise<Product[]> {
		this.logger.log('Finding all products');
		return await this.productRepository.findAll();
	}

	async findFavoritesByUserId(userId: number): Promise<Product[]> {
		this.logger.log(`Finding favorite products for user ID: ${userId}`);
		const favorites = await this.favoriteRepository.findByUserId(userId);
		const productFavorites = favorites.filter(
			(f) => f.relatedEntityType === RelatedEntityType.PRODUCT,
		);
		const productIds = productFavorites.map((f) => f.relatedEntityId);
		if (productIds.length === 0) {
			return [];
		}
		return await this.productRepository.findByIds(productIds);
	}

	async getFavoriteIds(userId: number | null): Promise<Set<number>> {
		if (!userId) {
			return new Set();
		}
		const favorites = await this.favoriteRepository.findByUserId(userId);
		return new Set(
			favorites
				.filter((f) => f.relatedEntityType === RelatedEntityType.PRODUCT)
				.map((f) => f.relatedEntityId),
		);
	}

	async update(id: number, updateDto: UpdateProductDto): Promise<Product> {
		this.logger.log(`Updating product with ID: ${id}`);
		const updateData: Partial<Product> = {};

		if (updateDto.name !== undefined) {
			updateData.name = updateDto.name;
		}

		if (updateDto.calories !== undefined) {
			updateData.calories = updateDto.calories;
		}

		if (updateDto.massa !== undefined) {
			updateData.massa = updateDto.massa;
		}

		if (updateDto.image !== undefined) {
			updateData.image = updateDto.image;
		}

		if (updateDto.fluffAt !== undefined) {
			updateData.fluffAt = updateDto.fluffAt;
		}

		return await this.productRepository.update(id, updateData);
	}

	async delete(id: number): Promise<void> {
		this.logger.log(`Deleting product with ID: ${id}`);
		await this.productRepository.findOne(id);
		await this.productRepository.delete(id);
	}
}

