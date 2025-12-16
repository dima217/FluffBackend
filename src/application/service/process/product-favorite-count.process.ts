import { Injectable, Inject, Logger } from '@nestjs/common';
import { IFavoriteProcessStrategy } from '@application/interface/process/favorite-process.strategy';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { Favorite } from '@domain/entities/favorite.entity';
import type { IProductRepository } from '@domain/interface/product.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ProductFavoriteCountProcess implements IFavoriteProcessStrategy {
	readonly type: RelatedEntityType = RelatedEntityType.PRODUCT;
	private readonly logger = new Logger(ProductFavoriteCountProcess.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.PRODUCT_REPOSITORY)
		private readonly productRepository: IProductRepository,
	) { }

	async executeOnCreate(favorite: Favorite): Promise<void> {
		this.logger.log(`Incrementing favorite count for product ID: ${favorite.relatedEntityId}`);
		const product = await this.productRepository.findOne(favorite.relatedEntityId);
		product.countFavorites = (product.countFavorites || 0) + 1;
		await this.productRepository.update(product.id, { countFavorites: product.countFavorites });
		this.logger.log(`Favorite count for product ID: ${favorite.relatedEntityId} is now ${product.countFavorites}`);
	}

	async executeOnDelete(favorite: Favorite): Promise<void> {
		this.logger.log(`Decrementing favorite count for product ID: ${favorite.relatedEntityId}`);
		const product = await this.productRepository.findOne(favorite.relatedEntityId);
		product.countFavorites = Math.max(0, (product.countFavorites || 0) - 1);
		await this.productRepository.update(product.id, { countFavorites: product.countFavorites });
		this.logger.log(`Favorite count for product ID: ${favorite.relatedEntityId} is now ${product.countFavorites}`);
	}
}

