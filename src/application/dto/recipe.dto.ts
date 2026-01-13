import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeImageDto {
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

export class RecipeImageMediaIdsDto {
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

export class RecipeResourceDto {
  @ApiProperty({ example: 1, description: 'Resource position' })
  @IsNumber()
  position: number;

  @ApiProperty({
    example: 'https://example.com/video.mp4',
    description:
      'Resource source URL. Use URL from prepare-step-resources-upload response or direct URL',
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'video', description: 'Resource type (e.g., video, image)' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

export class RecipeResourceMediaIdDto {
  @ApiProperty({ example: 1, description: 'Resource position' })
  @IsNumber()
  position: number;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Resource media ID from prepare-step-resources-upload response',
  })
  @IsString()
  @IsNotEmpty()
  mediaId: string;

  @ApiProperty({ example: 'video', description: 'Resource type (e.g., video, image)' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

export class RecipeStepDto {
  @ApiProperty({ example: 'Step 1: Prepare ingredients', description: 'Step name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Chop vegetables and prepare spices', description: 'Step description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [RecipeResourceDto], description: 'Step resources' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeResourceDto)
  resources: RecipeResourceDto[];
}

export class RecipeStepWithMediaIdsDto {
  @ApiProperty({ example: 'Step 1: Prepare ingredients', description: 'Step name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Chop vegetables and prepare spices', description: 'Step description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    type: [RecipeResourceMediaIdDto],
    description: 'Step resources with media IDs (from prepare-step-resources-upload)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeResourceMediaIdDto)
  resources: RecipeResourceMediaIdDto[];
}

export class RecipeStepsConfigDto {
  @ApiProperty({ type: [RecipeStepDto], description: 'Recipe steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps: RecipeStepDto[];
}

export class RecipeStepsConfigWithMediaIdsDto {
  @ApiProperty({ type: [RecipeStepWithMediaIdsDto], description: 'Recipe steps with media IDs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepWithMediaIdsDto)
  steps: RecipeStepWithMediaIdsDto[];
}

export class CreateRecipeWithMediaIdsDto {
  @ApiProperty({ example: 'Delicious Pasta', description: 'Recipe name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Recipe type ID' })
  @IsNumber()
  @IsNotEmpty()
  recipeTypeId: number;

  @ApiProperty({
    type: RecipeImageMediaIdsDto,
    description:
      'Recipe image media IDs from prepare-upload. Recipe will be created with mediaIds, then updated with URLs after file uploads.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeImageMediaIdsDto)
  imageMediaIds: RecipeImageMediaIdsDto;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439015',
    description: 'Promotional video media ID (from prepare-video-upload)',
  })
  @IsOptional()
  @IsString()
  promotionalVideoMediaId?: string;

  @ApiPropertyOptional({ example: 'A delicious pasta recipe', description: 'Recipe description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3], description: 'Product IDs from database' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({
    type: [String],
    example: ['молоко', 'яйца', 'сахар'],
    description:
      'Custom product names entered by user (arbitrary strings). These are stored as-is and not linked to database products.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customProducts?: string[];

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
  @IsOptional()
  @Type(() => Date)
  fluffAt?: Date;

  @ApiProperty({ example: 500, description: 'Calories count' })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({ example: 3600, description: 'Cooking time in seconds' })
  @IsNumber()
  @Min(0)
  cookAt: number;

  @ApiProperty({
    type: RecipeStepsConfigWithMediaIdsDto,
    description:
      'Recipe steps configuration with media IDs. Resources should use mediaId instead of source URL',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeStepsConfigWithMediaIdsDto)
  stepsConfig: RecipeStepsConfigWithMediaIdsDto;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Delicious Pasta', description: 'Recipe name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Recipe type ID' })
  @IsNumber()
  @IsNotEmpty()
  recipeTypeId: number;

  @ApiProperty({
    type: RecipeImageDto,
    description:
      'Recipe images (URLs). Use presigned URLs from POST /recipes/prepare-upload or direct URLs',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeImageDto)
  image: RecipeImageDto;

  @ApiPropertyOptional({
    example: 'https://example.com/promo.mp4',
    description: 'Promotional video URL',
  })
  @IsOptional()
  @IsString()
  promotionalVideo?: string;

  @ApiPropertyOptional({ example: 'A delicious pasta recipe', description: 'Recipe description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3], description: 'Product IDs from database' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({
    type: [String],
    example: ['молоко', 'яйца', 'сахар'],
    description:
      'Custom product names entered by user (arbitrary strings). These are stored as-is and not linked to database products.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customProducts?: string[];

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
  @IsOptional()
  @Type(() => Date)
  fluffAt?: Date;

  @ApiProperty({ example: 500, description: 'Calories count' })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({ example: 3600, description: 'Cooking time in seconds' })
  @IsNumber()
  @Min(0)
  cookAt: number;

  @ApiProperty({
    type: RecipeStepsConfigDto,
    description:
      'Recipe steps configuration. For resources in steps, use URLs from prepare-step-resources-upload or direct URLs',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeStepsConfigDto)
  stepsConfig: RecipeStepsConfigDto;
}

export class PrepareUploadDto {
  @ApiProperty({
    example: 'cover.jpg',
    description: 'Cover image filename',
  })
  @IsString()
  @IsNotEmpty()
  coverFilename: string;

  @ApiProperty({
    example: 1024000,
    description: 'Cover image size in bytes',
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
    description: 'Preview image size in bytes',
  })
  @IsNumber()
  @Min(1)
  previewSize: number;
}

export class PrepareStepResourceUploadItemDto {
  @ApiProperty({
    example: 'step1-video.mp4',
    description: 'Resource filename',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    example: 5242880,
    description: 'Resource file size in bytes',
  })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({
    example: 'video',
    description: 'Resource type (e.g., video, image)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 1,
    description: 'Resource position in step',
  })
  @IsNumber()
  position: number;
}

export class PrepareStepResourcesUploadDto {
  @ApiProperty({
    type: [PrepareStepResourceUploadItemDto],
    description: 'Array of step resources to upload',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrepareStepResourceUploadItemDto)
  resources: PrepareStepResourceUploadItemDto[];
}

export class StepResourceUploadResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Media ID',
  })
  mediaId: string;

  @ApiProperty({
    example: 'https://minio.example.com/bucket/user123/step1-video.mp4?X-Amz-Algorithm=...',
    description: 'Presigned URL for resource upload',
  })
  uploadUrl: string;

  @ApiProperty({
    example: '/user123/step1-video.mp4',
    description: 'Resource URL (use this in recipe creation)',
  })
  url: string;

  @ApiProperty({
    example: 1,
    description: 'Resource position in step',
  })
  position: number;

  @ApiProperty({
    example: 'video',
    description: 'Resource type',
  })
  type: string;
}

export class PrepareStepResourcesUploadResponseDto {
  @ApiProperty({
    type: [StepResourceUploadResponseDto],
    description: 'Array of presigned URLs for step resources',
  })
  resources: StepResourceUploadResponseDto[];
}

export class PrepareVideoUploadDto {
  @ApiProperty({
    example: 'promo.mp4',
    description: 'Video filename',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    example: 10485760,
    description: 'Video file size in bytes',
  })
  @IsNumber()
  @Min(1)
  size: number;
}

export class PrepareVideoUploadResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439015',
    description: 'Video media ID',
  })
  mediaId: string;

  @ApiProperty({
    example: 'https://minio.example.com/bucket/user123/promo.mp4?X-Amz-Algorithm=...',
    description: 'Presigned URL for video upload',
  })
  uploadUrl: string;

  @ApiProperty({
    example: '/user123/promo.mp4',
    description: 'Video URL (use this in recipe creation)',
  })
  url: string;
}

export class ConfirmRecipeUploadDto {
  @ApiProperty({
    example: 1,
    description: 'Recipe ID from create-with-media-ids response',
  })
  @IsNumber()
  @IsNotEmpty()
  recipeId: number;

  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439015'],
    description:
      'Array of all media IDs that were uploaded (cover, preview, promotionalVideo if provided, and step resources)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  mediaIds: string[];
}

export class PrepareUploadResponseDto {
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
    description: 'Cover image URL (use this in recipe creation)',
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
    description: 'Preview image URL (use this in recipe creation)',
  })
  previewUrl: string;
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Delicious Pasta', description: 'Recipe name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'Recipe type ID' })
  @IsOptional()
  @IsNumber()
  recipeTypeId?: number;

  @ApiPropertyOptional({ type: RecipeImageDto, description: 'Recipe images' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeImageDto)
  image?: RecipeImageDto;

  @ApiPropertyOptional({
    example: 'https://example.com/promo.mp4',
    description: 'Promotional video URL',
  })
  @IsOptional()
  @IsString()
  promotionalVideo?: string;

  @ApiPropertyOptional({ example: 'A delicious pasta recipe', description: 'Recipe description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3], description: 'Product IDs from database' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];

  @ApiPropertyOptional({
    type: [String],
    example: ['молоко', 'яйца', 'сахар'],
    description:
      'Custom product names entered by user (arbitrary strings). These are stored as-is and not linked to database products.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customProducts?: string[];

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
  @IsOptional()
  @Type(() => Date)
  fluffAt?: Date;

  @ApiPropertyOptional({ example: 500, description: 'Calories count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional({ example: 3600, description: 'Cooking time in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cookAt?: number;

  @ApiPropertyOptional({ type: RecipeStepsConfigDto, description: 'Recipe steps configuration' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeStepsConfigDto)
  stepsConfig?: RecipeStepsConfigDto;
}

export class RecipeResponseDto {
  @ApiProperty({ example: 1, description: 'Recipe ID' })
  id: number;

  @ApiPropertyOptional({
    example: { id: 1, firstName: 'John', lastName: 'Doe' },
    description: 'User who created the recipe',
  })
  user: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;

  @ApiProperty({ example: 'Delicious Pasta', description: 'Recipe name' })
  name: string;

  @ApiProperty({ example: { id: 1, name: 'Main Course' }, description: 'Recipe type' })
  type: {
    id: number;
    name: string;
  };

  @ApiProperty({ example: 4.5, description: 'Average rating' })
  average: number;

  @ApiProperty({ example: false, description: 'Whether the recipe is in user favorites' })
  favorite: boolean;

  @ApiProperty({ type: RecipeImageDto, description: 'Recipe images' })
  image: RecipeImageDto;

  @ApiPropertyOptional({
    example: 'https://example.com/promo.mp4',
    description: 'Promotional video URL',
  })
  promotionalVideo: string | null;

  @ApiPropertyOptional({ example: 'A delicious pasta recipe', description: 'Recipe description' })
  description: string | null;

  @ApiProperty({ type: [Number], example: [1, 2, 3], description: 'Product IDs' })
  products: number[];

  @ApiPropertyOptional({
    type: [String],
    example: ['молоко', 'яйца', 'сахар'],
    description: 'Custom product names entered by user (arbitrary strings)',
  })
  customProducts: string[];

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Fluff date' })
  fluffAt: Date | null;

  @ApiProperty({ example: 500, description: 'Calories count' })
  calories: number;

  @ApiProperty({ example: 3600, description: 'Cooking time in seconds' })
  cookAt: number;

  @ApiProperty({ type: RecipeStepsConfigDto, description: 'Recipe steps configuration' })
  stepsConfig: RecipeStepsConfigDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}
