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
  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    description: 'Cover image URL (required if coverFile is not provided)',
  })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/preview.jpg',
    description: 'Preview image URL (required if previewFile is not provided)',
  })
  @IsOptional()
  @IsString()
  preview?: string;
}

export class RecipeResourceDto {
  @ApiProperty({ example: 1, description: 'Resource position' })
  @IsNumber()
  position: number;

  @ApiProperty({ example: 'https://example.com/video.mp4', description: 'Resource source URL' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'video', description: 'Resource type' })
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

export class RecipeStepsConfigDto {
  @ApiProperty({ type: [RecipeStepDto], description: 'Recipe steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps: RecipeStepDto[];
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

  @ApiPropertyOptional({
    type: RecipeImageDto,
    description: 'Recipe images (URLs). Required if files are not provided via multipart/form-data',
  })
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

  @ApiProperty({ type: [Number], example: [1, 2, 3], description: 'Product IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[];

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

  @ApiProperty({ type: RecipeStepsConfigDto, description: 'Recipe steps configuration' })
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeStepsConfigDto)
  stepsConfig: RecipeStepsConfigDto;
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

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3], description: 'Product IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];

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
