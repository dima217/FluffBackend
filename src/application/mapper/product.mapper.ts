import { Product } from '@domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '@application/dto/product.dto';

export class ProductMapper {
	static toEntity(createDto: CreateProductDto): Product {
		return {
			name: createDto.name,
			calories: createDto.calories,
			massa: createDto.massa,
			image: createDto.image || null,
			fluffAt: createDto.fluffAt || null,
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
			fluffAt: product.fluffAt,
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

