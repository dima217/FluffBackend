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
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '@application/dto/product.dto';
import { ProductMapper } from '@application/mapper/product.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) { }

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new product', description: 'Create a new product' })
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

