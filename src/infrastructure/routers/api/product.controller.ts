import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	HttpCode,
	HttpStatus,
	ParseIntPipe,
	BadRequestException,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiBody,
	ApiParam,
} from '@nestjs/swagger';
import { ProductService } from '@application/service/product.service';
import {
	CreateProductDto,
	CreateProductWithMediaIdsDto,
	UpdateProductDto,
	ProductResponseDto,
	ConfirmProductUploadDto,
	PrepareProductUploadDto,
	PrepareProductUploadResponseDto,
} from '@application/dto/product.dto';
import { ProductMapper } from '@application/mapper/product.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { Token } from '@infrastructure/decorator/token.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) { }

	@Post('prepare-upload')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Prepare upload URLs for product images',
		description:
			'Get presigned URLs for direct upload to S3/MinIO. Use this endpoint before creating a product with file uploads.\n\n' +
			'**Workflow:**\n' +
			'1. Call this endpoint to get presigned URLs\n' +
			'2. Upload files directly to S3/MinIO using the presigned URLs (PUT request with file content)\n' +
			'3. Call POST /products/mark-uploaded/{mediaId} for each uploaded file\n' +
			'4. Create product using the returned media IDs in POST /products/create-with-media-ids\n' +
			'5. Finally, call POST /products/confirm-upload/{productId} to finalize the product with actual URLs.',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiBody({ type: PrepareProductUploadDto })
	@ApiResponse({
		status: 200,
		description: 'Presigned URLs generated successfully',
		type: PrepareProductUploadResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async prepareUpload(
		@UserDecorator() user: UserEntity | null,
		@Body() prepareDto: PrepareProductUploadDto,
		@Token() token: string,
	): Promise<PrepareProductUploadResponseDto> {
		if (!token) {
			throw new BadRequestException('JWT token is required');
		}
		const userId = user?.id || null;
		return await this.productService.prepareUpload(userId, prepareDto, token);
	}

	@Post('mark-uploaded/:mediaId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Mark media as uploaded',
		description:
			'Mark a media file as successfully uploaded after direct upload to S3/MinIO using presigned URL.',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiParam({
		name: 'mediaId',
		type: String,
		description: 'Media ID from prepare-upload response',
	})
	@ApiResponse({ status: 200, description: 'Media marked as uploaded successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async markUploaded(
		@Param('mediaId') mediaId: string,
		@Token() token?: string,
	): Promise<{ success: boolean }> {
		if (!token) {
			throw new BadRequestException('JWT token is required');
		}
		await this.productService.markMediaAsUploaded(mediaId, token);
		return { success: true };
	}

	@Post('create-with-media-ids')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Create a new product with media IDs',
		description:
			'Create a new product by providing media IDs for images. ' +
			'This is the first phase of a two-phase upload process. ' +
			'After this, files must be uploaded to S3/MinIO using presigned URLs, and then POST /products/confirm-upload/{productId} must be called.',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiBody({ type: CreateProductWithMediaIdsDto })
	@ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async createWithMediaIds(
		@Body() createDto: CreateProductWithMediaIdsDto,
	): Promise<ProductResponseDto> {
		const product = await this.productService.createWithMediaIds(createDto);
		return ProductMapper.toResponseDto(product);
	}

	@Post('confirm-upload/:productId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Confirm product upload and finalize image URLs',
		description:
			'This is the second phase of a two-phase upload process. ' +
			'After files have been uploaded to S3/MinIO and marked as loaded, ' +
			'call this endpoint to validate all media IDs and update the product with final image URLs.',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiParam({ name: 'productId', type: Number, description: 'ID of the product to confirm upload for' })
	@ApiBody({ type: ConfirmProductUploadDto })
	@ApiResponse({
		status: 200,
		description: 'Product images finalized successfully',
		type: ProductResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request - media files not loaded or invalid media IDs' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Product not found' })
	async confirmUpload(
		@Param('productId', ParseIntPipe) productId: number,
		@Body() confirmDto: ConfirmProductUploadDto,
		@Token() token: string,
	): Promise<ProductResponseDto> {
		if (!token) {
			throw new BadRequestException('JWT token is required');
		}
		const product = await this.productService.confirmUpload(productId, confirmDto, token);
		return ProductMapper.toResponseDto(product);
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Create a new product',
		description:
			'Create a new product with image URLs.\n\n' +
			'**Two methods for providing images:**\n\n' +
			'**Method 1: Direct URL (for external images)**\n' +
			'- Use JSON format with `image.cover` and `image.preview` URLs\n\n' +
			'**Method 2: Presigned URL Upload (recommended for file uploads)**\n' +
			'- Call POST /products/prepare-upload first to get presigned URLs\n' +
			'- Upload files directly to S3/MinIO using presigned URLs (PUT request)\n' +
			'- Call POST /products/mark-uploaded/:mediaId for each uploaded file\n' +
			'- Then call POST /products/create-with-media-ids with the returned media IDs\n' +
			'- Finally, call POST /products/confirm-upload/:productId to finalize the product with actual URLs.',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiBody({ type: CreateProductDto })
	@ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async create(@Body() createDto: CreateProductDto): Promise<ProductResponseDto> {
		const product = await this.productService.create(createDto);
		return ProductMapper.toResponseDto(product);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@Public()
	@ApiOperation({ summary: 'Get all products', description: 'Retrieve all products' })
	@ApiResponse({ status: 200, description: 'Products retrieved successfully', type: [ProductResponseDto] })
	async findAll(@UserDecorator() user: UserEntity | null): Promise<ProductResponseDto[]> {
		const userId = user?.id || null;
		const products = await this.productService.findAll(userId);
		const favoriteIds = await this.productService.getFavoriteIds(userId);
		return ProductMapper.toResponseDtoList(products, favoriteIds);
	}

	@Get('favorites')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get favorite products', description: 'Retrieve all favorite products for current user' })
	@ApiBearerAuth('JWT-auth')
	@ApiResponse({ status: 200, description: 'Favorite products retrieved successfully', type: [ProductResponseDto] })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async findFavorites(@UserDecorator() user: UserEntity): Promise<ProductResponseDto[]> {
		const products = await this.productService.findFavoritesByUserId(user.id);
		const favoriteIds = await this.productService.getFavoriteIds(user.id);
		return ProductMapper.toResponseDtoList(products, favoriteIds);
	}

	@Get(':id')
	@HttpCode(HttpStatus.OK)
	@Public()
	@ApiOperation({ summary: 'Get product by ID', description: 'Retrieve a specific product by its ID' })
	@ApiParam({ name: 'id', type: Number, description: 'Product ID' })
	@ApiResponse({ status: 200, description: 'Product retrieved successfully', type: ProductResponseDto })
	@ApiResponse({ status: 404, description: 'Product not found' })
	async findOne(
		@Param('id', ParseIntPipe) id: number,
		@UserDecorator() user: UserEntity | null,
	): Promise<ProductResponseDto> {
		const userId = user?.id || null;
		const product = await this.productService.findOne(id, userId);
		const favoriteIds = await this.productService.getFavoriteIds(userId);
		return ProductMapper.toResponseDto(product, favoriteIds);
	}

	@Put(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update product', description: 'Update an existing product' })
	@ApiBearerAuth('JWT-auth')
	@ApiParam({ name: 'id', type: Number, description: 'Product ID' })
	@ApiBody({ type: UpdateProductDto })
	@ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Product not found' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateDto: UpdateProductDto,
	): Promise<ProductResponseDto> {
		const product = await this.productService.update(id, updateDto);
		return ProductMapper.toResponseDto(product);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete product', description: 'Delete a product' })
	@ApiBearerAuth('JWT-auth')
	@ApiParam({ name: 'id', type: Number, description: 'Product ID' })
	@ApiResponse({ status: 204, description: 'Product deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Product not found' })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.productService.delete(id);
	}
}

