import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
  ApiQuery,
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
import { PaginationQueryDto, PaginatedResponseDto } from '@application/dto/pagination.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
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
  @ApiParam({
    name: 'productId',
    type: Number,
    description: 'ID of the product to confirm upload for',
  })
  @ApiBody({ type: ConfirmProductUploadDto })
  @ApiResponse({
    status: 200,
    description: 'Product images finalized successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - media files not loaded or invalid media IDs',
  })
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
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productService.create(createDto);
    return ProductMapper.toResponseDto(product);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieve all products with pagination support.\n\n' +
      '**Pagination:**\n' +
      '- Use `page` query parameter to specify page number (1-based, default: 1)\n' +
      '- Use `limit` query parameter to specify items per page (1-100, default: 10)\n' +
      '- Response includes `data` array and `meta` object with pagination information\n\n' +
      '**Example requests:**\n' +
      '- `GET /products` - Returns first 10 products (default)\n' +
      '- `GET /products?page=1&limit=20` - Returns first 20 products\n' +
      '- `GET /products?page=2&limit=10` - Returns products 11-20',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (1-based indexing). First page is 1. Default: 1',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items per page. Maximum value is 100. Default: 10',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Array of products for the current page',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        meta: {
          type: 'object',
          description: 'Pagination metadata',
          properties: {
            page: { type: 'number', description: 'Current page number', example: 1 },
            limit: { type: 'number', description: 'Items per page', example: 10 },
            total: { type: 'number', description: 'Total number of items', example: 100 },
            totalPages: { type: 'number', description: 'Total number of pages', example: 10 },
          },
        },
      },
    },
  })
  async findAll(
    @UserDecorator() user: UserEntity | null,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const userId = user?.id || null;
    const page = paginationQuery.page || 1;
    const limit = paginationQuery.limit || 10;
    const result = await this.productService.findAll(userId, page, limit);
    const favoriteIds = await this.productService.getFavoriteIds(userId);
    const totalPages = Math.ceil(result.total / limit);

    return {
      data: ProductMapper.toResponseDtoList(result.data, favoriteIds),
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }

  @Get('by-ids')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get products by IDs',
    description:
      'Retrieve products by a list of IDs.\n\n' +
      '**Usage:**\n' +
      '- Pass product IDs as comma-separated values in the `ids` query parameter\n' +
      '- Example: `GET /products/by-ids?ids=1,2,3,5`\n' +
      '- Returns only products that exist in the database\n' +
      '- Order of returned products may differ from the order of requested IDs\n\n' +
      "**Note:** If some IDs don't exist, they will be silently skipped. Only existing products will be returned.",
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    required: true,
    description: 'Comma-separated list of product IDs (e.g., "1,2,3,5")',
    example: '1,2,3,5',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing or invalid ids parameter' })
  async findByIds(
    @Query('ids') idsParam: string,
    @UserDecorator() user: UserEntity | null,
  ): Promise<ProductResponseDto[]> {
    if (!idsParam || idsParam.trim().length === 0) {
      throw new BadRequestException('ids parameter is required');
    }

    // Parse comma-separated IDs
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .map((id) => {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0) {
          throw new BadRequestException(`Invalid product ID: ${id}`);
        }
        return parsedId;
      });

    if (ids.length === 0) {
      throw new BadRequestException('At least one valid product ID is required');
    }

    const userId = user?.id || null;
    const products = await this.productService.findByIds(ids, userId);
    const favoriteIds = await this.productService.getFavoriteIds(userId);
    return ProductMapper.toResponseDtoList(products, favoriteIds);
  }

  @Get('favorites')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get favorite products',
    description: 'Retrieve all favorite products for current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Favorite products retrieved successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findFavorites(@UserDecorator() user: UserEntity): Promise<ProductResponseDto[]> {
    const products = await this.productService.findFavoritesByUserId(user.id);
    const favoriteIds = await this.productService.getFavoriteIds(user.id);
    return ProductMapper.toResponseDtoList(products, favoriteIds);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Search products',
    description:
      'Search products by name. The search query can contain product names separated by commas or spaces (e.g., "молоко, яйца" or "молоко яйца").\n\n' +
      '**Search logic:**\n' +
      '1. If exact product name matches are found, returns only those products\n' +
      '2. If no exact matches, searches for partial product name matches\n' +
      '3. Returns all products that match any of the search terms',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    required: true,
    description: 'Search query (product names, e.g., "молоко, яйца" or "молоко яйца")',
    example: 'молоко, яйца',
  })
  @ApiResponse({
    status: 200,
    description: 'Products found successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing search query' })
  async search(
    @Query('q') searchQuery: string,
    @UserDecorator() user: UserEntity | null,
  ): Promise<ProductResponseDto[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }
    const userId = user?.id || null;
    const products = await this.productService.search(searchQuery, userId);
    const favoriteIds = await this.productService.getFavoriteIds(userId);
    return ProductMapper.toResponseDtoList(products, favoriteIds);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieve a specific product by its ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
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
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
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
