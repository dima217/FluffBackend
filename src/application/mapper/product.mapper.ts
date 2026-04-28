import { Product, type ProductImageMediaIds } from '@domain/entities/product.entity';
import {
	CreateProductDto,
	CreateProductWithMediaIdsDto,
	UpdateProductDto,
	ProductResponseDto,
} from '@application/dto/product.dto';

export class ProductMapper {
	static toEntity(createDto: CreateProductDto): Product {
		return {
			name: createDto.name,
			calories: createDto.calories,
			massa: createDto.massa,
			image: createDto.image || null,
			imageMediaIds: null,
			isFluff: createDto.isFluff,
			countFavorites: 0,
		} as Product;
	}

	static toEntityWithMediaIds(createDto: CreateProductWithMediaIdsDto): Product {
		return {
			name: createDto.name,
			calories: createDto.calories,
			massa: createDto.massa,
			image: {
				cover: `media:${createDto.imageMediaIds.coverMediaId}`, // Placeholder
				preview: `media:${createDto.imageMediaIds.previewMediaId}`, // Placeholder
			},
			imageMediaIds: {
				coverMediaId: createDto.imageMediaIds.coverMediaId,
				previewMediaId: createDto.imageMediaIds.previewMediaId,
			} as ProductImageMediaIds,
			isFluff: createDto.isFluff,
			countFavorites: 0,
		} as Product;
	}

	static toResponseDto(product: Product, favoriteIds?: Set<number>): ProductResponseDto {
		return {
			id: product.id,
			name: product.name,
			calories: Number(product.calories),
			massa: Number(product.massa),
			image: product.image,
			countFavorites: product.countFavorites || 0,
			favorite: favoriteIds ? favoriteIds.has(product.id) : false,
			isFluff: product.isFluff,
			createdAt: product.createdAt,
		};
	}

	static toResponseDtoList(
		products: Product[],
		favoriteIds?: Set<number>,
	): ProductResponseDto[] {
		return products.map((product) => this.toResponseDto(product, favoriteIds));
	}
}

