import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IProductService } from '@application/interface/service/product.service';
import type { IProductRepository } from '@domain/interface/product.repository';
import type { IFavoriteRepository } from '@domain/interface/favorite.repository';
import { Product } from '@domain/entities/product.entity';
import {
	CreateProductDto,
	CreateProductWithMediaIdsDto,
	UpdateProductDto,
	ConfirmProductUploadDto,
	PrepareProductUploadDto,
	PrepareProductUploadResponseDto,
} from '@application/dto/product.dto';
import { ProductMapper } from '@application/mapper/product.mapper';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { MediaService } from '@application/service/media.service';

@Injectable()
export class ProductService implements IProductService {
	private readonly logger = new Logger(ProductService.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.PRODUCT_REPOSITORY)
		private readonly productRepository: IProductRepository,
		@Inject(REPOSITORY_CONSTANTS.FAVORITE_REPOSITORY)
		private readonly favoriteRepository: IFavoriteRepository,
		private readonly mediaService: MediaService,
		private readonly configService: ConfigService<AppConfig>,
	) {}

	async create(createDto: CreateProductDto): Promise<Product> {
		this.logger.log(`Creating product: ${createDto.name}`);
		const product = ProductMapper.toEntity(createDto);
		return await this.productRepository.create(product);
	}

	async createWithMediaIds(createDto: CreateProductWithMediaIdsDto): Promise<Product> {
		this.logger.log(`Creating product with mediaIds: ${createDto.name}`);
		const product = ProductMapper.toEntityWithMediaIds(createDto);
		return await this.productRepository.create(product);
	}

	async confirmUpload(
		productId: number,
		confirmDto: ConfirmProductUploadDto,
		token: string,
	): Promise<Product> {
		this.logger.log(`Confirming upload for product ID: ${productId}`);

		if (productId !== confirmDto.productId) {
			throw new BadRequestException('Product ID mismatch');
		}

		const product = await this.productRepository.findOne(productId);
		if (!product.imageMediaIds) {
			throw new BadRequestException('Product was not created with mediaIds');
		}

		// Get URLs for all media files
		const mediaUrls = await this.mediaService.getMediaUrls(confirmDto.mediaIds, token);

		// Check that all media files are loaded
		const notLoaded = mediaUrls.filter((m) => !m.isLoaded);
		if (notLoaded.length > 0) {
			throw new BadRequestException(
				`Some media files are not loaded: ${notLoaded.map((m) => m.mediaId).join(', ')}`,
			);
		}

		// Get backend base URL for proxy endpoints
		const appConfig = this.configService.get<AppConfig>('app', { infer: true });
		const backendBaseUrl = process.env.APP_BASE_URL || `http://localhost:${appConfig?.port ?? 3000}`;

		// Helper function to convert media service URL to proxy URL
		const getProxyUrl = (mediaId: string): string => {
			return `${backendBaseUrl}/api/media/${mediaId}`;
		};

		// Update product images with proxy URLs
		const coverMediaId = product.imageMediaIds.coverMediaId;
		const previewMediaId = product.imageMediaIds.previewMediaId;

		if (!coverMediaId || !previewMediaId) {
			throw new BadRequestException('Cover or preview media ID not found');
		}

		const coverUrl = getProxyUrl(coverMediaId);
		const previewUrl = getProxyUrl(previewMediaId);

		const updateData: Partial<Product> = {
			image: {
				cover: coverUrl,
				preview: previewUrl,
			},
			imageMediaIds: null, // Clear mediaIds after successful update
		};

		return await this.productRepository.update(productId, updateData);
	}

	async prepareUpload(
		userId: number | null,
		prepareDto: PrepareProductUploadDto,
		token: string,
	): Promise<PrepareProductUploadResponseDto> {
		this.logger.log(`Preparing upload for product images`);

		// Create media records in parallel
		const [coverMedia, previewMedia] = await Promise.all([
			this.mediaService.createMedia(
				{
					filename: prepareDto.coverFilename,
					size: prepareDto.coverSize,
					metadata: {
						type: 'product-cover',
						userId: userId?.toString(),
					},
				},
				token,
			),
			this.mediaService.createMedia(
				{
					filename: prepareDto.previewFilename,
					size: prepareDto.previewSize,
					metadata: {
						type: 'product-preview',
						userId: userId?.toString(),
					},
				},
				token,
			),
		]);

		return {
			coverMediaId: coverMedia.mediaId,
			coverUploadUrl: coverMedia.uploadUrl,
			coverUrl: coverMedia.url,
			previewMediaId: previewMedia.mediaId,
			previewUploadUrl: previewMedia.uploadUrl,
			previewUrl: previewMedia.url,
		};
	}

	async markMediaAsUploaded(mediaId: string, token: string): Promise<void> {
		this.logger.log(`Marking media ${mediaId} as uploaded`);
		await this.mediaService.markAsLoaded(mediaId, token);
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

