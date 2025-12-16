import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
	@ApiProperty({ example: 'https://example.com/cover.jpg', description: 'Cover image URL' })
	@IsString()
	@IsNotEmpty()
	cover: string;

	@ApiProperty({ example: 'https://example.com/preview.jpg', description: 'Preview image URL' })
	@IsString()
	@IsNotEmpty()
	preview: string;
}

export class CreateProductDto {
	@ApiProperty({ example: 'Tomato', description: 'Product name' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ example: 25, description: 'Calories per 100g' })
	@IsNumber()
	@Min(0.01)
	calories: number;

	@ApiProperty({ example: 100, description: 'Mass in grams' })
	@IsNumber()
	@Min(0.01)
	massa: number;

	@ApiPropertyOptional({ type: ProductImageDto, description: 'Product images' })
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => ProductImageDto)
	image?: ProductImageDto;

	@ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
	@IsOptional()
	@Type(() => Date)
	fluffAt?: Date;
}

export class UpdateProductDto {
	@ApiPropertyOptional({ example: 'Tomato', description: 'Product name' })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;

	@ApiPropertyOptional({ example: 25, description: 'Calories per 100g' })
	@IsOptional()
	@IsNumber()
	@Min(0.01)
	calories?: number;

	@ApiPropertyOptional({ example: 100, description: 'Mass in grams' })
	@IsOptional()
	@IsNumber()
	@Min(0.01)
	massa?: number;

	@ApiPropertyOptional({ type: ProductImageDto, description: 'Product images' })
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => ProductImageDto)
	image?: ProductImageDto | null;

	@ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
	@IsOptional()
	@Type(() => Date)
	fluffAt?: Date | null;
}

export class ProductResponseDto {
	@ApiProperty({ example: 1, description: 'Product ID' })
	id: number;

	@ApiProperty({ example: 'Tomato', description: 'Product name' })
	name: string;

	@ApiProperty({ example: 25, description: 'Calories per 100g' })
	calories: number;

	@ApiProperty({ example: 100, description: 'Mass in grams' })
	massa: number;

	@ApiPropertyOptional({ type: ProductImageDto, description: 'Product images' })
	image: ProductImageDto | null;

	@ApiProperty({ example: 5, description: 'Number of favorites' })
	countFavorites: number;

	@ApiProperty({ example: false, description: 'Whether the product is in user favorites' })
	favorite: boolean;

	@ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
	fluffAt: Date | null;

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
	createdAt: Date;
}

