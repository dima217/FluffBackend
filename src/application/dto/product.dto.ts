import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsObject,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @ApiProperty({
    example: 'https://example.com/cover.jpg',
    description: 'Cover image URL. Use URL from prepare-upload response or direct URL',
  })
  @IsString()
  @IsNotEmpty()
  cover: string;

  @ApiProperty({
    example: 'https://example.com/preview.jpg',
    description: 'Preview image URL. Use URL from prepare-upload response or direct URL',
  })
  @IsString()
  @IsNotEmpty()
  preview: string;
}

export class ProductImageMediaIdsDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Cover image media ID from prepare-upload response',
  })
  @IsString()
  @IsNotEmpty()
  coverMediaId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Preview image media ID from prepare-upload response',
  })
  @IsString()
  @IsNotEmpty()
  previewMediaId: string;
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

export class CreateProductWithMediaIdsDto {
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

  @ApiProperty({
    type: ProductImageMediaIdsDto,
    description:
      'Product image media IDs from prepare-upload. Product will be created with mediaIds, then updated with URLs after file uploads.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ProductImageMediaIdsDto)
  imageMediaIds: ProductImageMediaIdsDto;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
  @IsOptional()
  @Type(() => Date)
  fluffAt?: Date;
}

export class ConfirmProductUploadDto {
  @ApiProperty({
    example: 1,
    description: 'Product ID from create-with-media-ids response',
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of all media IDs that were uploaded (cover and preview)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  mediaIds: string[];
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

export class PrepareProductUploadDto {
  @ApiProperty({
    example: 'cover.jpg',
    description: 'Cover image filename',
  })
  @IsString()
  @IsNotEmpty()
  coverFilename: string;

  @ApiProperty({
    example: 1024000,
    description: 'Cover image file size in bytes',
  })
  @IsNumber()
  @Min(1)
  coverSize: number;

  @ApiProperty({
    example: 'preview.jpg',
    description: 'Preview image filename',
  })
  @IsString()
  @IsNotEmpty()
  previewFilename: string;

  @ApiProperty({
    example: 512000,
    description: 'Preview image file size in bytes',
  })
  @IsNumber()
  @Min(1)
  previewSize: number;
}

export class PrepareProductUploadResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Cover media ID',
  })
  coverMediaId: string;

  @ApiProperty({
    example: 'https://minio.example.com/bucket/user123/cover.jpg?X-Amz-Algorithm=...',
    description: 'Presigned URL for cover image upload',
  })
  coverUploadUrl: string;

  @ApiProperty({
    example: '/user123/cover.jpg',
    description: 'Cover image URL (use this in product creation)',
  })
  coverUrl: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Preview media ID',
  })
  previewMediaId: string;

  @ApiProperty({
    example: 'https://minio.example.com/bucket/user123/preview.jpg?X-Amz-Algorithm=...',
    description: 'Presigned URL for preview image upload',
  })
  previewUploadUrl: string;

  @ApiProperty({
    example: '/user123/preview.jpg',
    description: 'Preview image URL (use this in product creation)',
  })
  previewUrl: string;
}
