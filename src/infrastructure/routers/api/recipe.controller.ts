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
  ForbiddenException,
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
import { RecipeService } from '@application/service/recipe.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeResponseDto,
  PrepareUploadDto,
  PrepareUploadResponseDto,
} from '@application/dto/recipe.dto';
import { RecipeMapper } from '@application/mapper/recipe.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { Token } from '@infrastructure/decorator/token.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post('prepare-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prepare upload URLs for recipe images',
    description:
      'Get presigned URLs for direct upload to S3/MinIO. Use this endpoint before creating a recipe with file uploads.\n\n' +
      '**Workflow:**\n' +
      '1. Call this endpoint to get presigned URLs\n' +
      '2. Upload files directly to S3/MinIO using the presigned URLs (PUT request with file content)\n' +
      '3. Call POST /recipes/mark-uploaded/{mediaId} for each uploaded file\n' +
      '4. Create recipe using the returned URLs in image.cover and image.preview fields',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: PrepareUploadDto })
  @ApiResponse({
    status: 200,
    description: 'Presigned URLs generated successfully',
    type: PrepareUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async prepareUpload(
    @UserDecorator() user: UserEntity | null,
    @Body() prepareDto: PrepareUploadDto,
    @Token() token: string,
  ): Promise<PrepareUploadResponseDto> {
    if (!token) {
      throw new BadRequestException('JWT token is required');
    }
    const userId = user?.id || null;
    return await this.recipeService.prepareUpload(userId, prepareDto, token);
  }

  @Post('mark-uploaded/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark media as uploaded',
    description:
      'Mark a media file as successfully uploaded after direct upload to S3/MinIO using presigned URL.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'mediaId', type: String, description: 'Media ID from prepare-upload response' })
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
    await this.recipeService.markMediaAsUploaded(mediaId, token);
    return { success: true };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new recipe',
    description:
      'Create a new recipe with image URLs.\n\n' +
      '**Two methods for providing images:**\n\n' +
      '**Method 1: Direct URL (for external images)**\n' +
      '- Use JSON format with `image.cover` and `image.preview` URLs\n\n' +
      '**Method 2: Presigned URL Upload (recommended for file uploads)**\n' +
      '- Call POST /recipes/prepare-upload first to get presigned URLs\n' +
      '- Upload files directly to S3/MinIO using presigned URLs (PUT request)\n' +
      '- Call POST /recipes/mark-uploaded/:mediaId for each uploaded file\n' +
      '- Use returned URLs in `image.cover` and `image.preview` fields',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({ status: 201, description: 'Recipe created successfully', type: RecipeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'RecipeType or Product not found' })
  async create(
    @UserDecorator() user: UserEntity | null,
    @Body() createDto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const userId = user?.id || null;
    const recipe = await this.recipeService.create(userId, createDto);
    return RecipeMapper.toResponseDto(recipe);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Get all recipes', description: 'Retrieve all recipes' })
  @ApiResponse({
    status: 200,
    description: 'Recipes retrieved successfully',
    type: [RecipeResponseDto],
  })
  async findAll(@UserDecorator() user: UserEntity | null): Promise<RecipeResponseDto[]> {
    const userId = user?.id || null;
    const recipes = await this.recipeService.findAll(userId);
    const favoriteIds = await this.recipeService.getFavoriteIds(userId);
    return RecipeMapper.toResponseDtoList(recipes, favoriteIds);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my recipes',
    description: 'Retrieve all recipes created by the current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Recipes retrieved successfully',
    type: [RecipeResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyRecipes(@UserDecorator() user: UserEntity): Promise<RecipeResponseDto[]> {
    const recipes = await this.recipeService.findByUserId(user.id);
    const favoriteIds = await this.recipeService.getFavoriteIds(user.id);
    return RecipeMapper.toResponseDtoList(recipes, favoriteIds);
  }

  @Get('favorites')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get favorite recipes',
    description: 'Retrieve all favorite recipes for current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Favorite recipes retrieved successfully',
    type: [RecipeResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findFavorites(@UserDecorator() user: UserEntity): Promise<RecipeResponseDto[]> {
    const recipes = await this.recipeService.findFavoritesByUserId(user.id);
    const favoriteIds = await this.recipeService.getFavoriteIds(user.id);
    return RecipeMapper.toResponseDtoList(recipes, favoriteIds);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get recipe by ID',
    description: 'Retrieve a specific recipe by its ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Recipe ID' })
  @ApiResponse({
    status: 200,
    description: 'Recipe retrieved successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserDecorator() user: UserEntity | null,
  ): Promise<RecipeResponseDto> {
    const userId = user?.id || null;
    const recipe = await this.recipeService.findOne(id);
    const favoriteIds = await this.recipeService.getFavoriteIds(userId);
    return RecipeMapper.toResponseDto(recipe, favoriteIds);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update recipe',
    description: 'Update an existing recipe (only owner can update)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number, description: 'Recipe ID' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully', type: RecipeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UserDecorator() user: UserEntity | null,
    @Body() updateDto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const userId = user?.id || null;
    const recipe = await this.recipeService.update(id, userId, updateDto);
    const favoriteIds = await this.recipeService.getFavoriteIds(userId);
    return RecipeMapper.toResponseDto(recipe, favoriteIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete recipe',
    description: 'Delete a recipe (only owner can delete)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number, description: 'Recipe ID' })
  @ApiResponse({ status: 204, description: 'Recipe deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @UserDecorator() user: UserEntity | null,
  ): Promise<void> {
    const userId = user?.id || null;
    await this.recipeService.delete(id, userId);
  }
}
