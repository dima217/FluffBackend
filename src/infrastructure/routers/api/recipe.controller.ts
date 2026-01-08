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
  CreateRecipeWithMediaIdsDto,
  UpdateRecipeDto,
  RecipeResponseDto,
  PrepareUploadDto,
  PrepareUploadResponseDto,
  PrepareStepResourcesUploadDto,
  PrepareStepResourcesUploadResponseDto,
  ConfirmRecipeUploadDto,
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

  @Post('prepare-step-resources-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prepare upload URLs for step resources',
    description:
      'Get presigned URLs for direct upload to S3/MinIO for step resources (images/videos). Use this endpoint before creating a recipe with step resource uploads.\n\n' +
      '**Workflow:**\n' +
      '1. Call this endpoint to get presigned URLs for all step resources\n' +
      '2. Upload files directly to S3/MinIO using the presigned URLs (PUT request with file content)\n' +
      '3. Call POST /recipes/mark-uploaded/{mediaId} for each uploaded file\n' +
      '4. Create recipe using the returned URLs in stepsConfig.steps[].resources[].source fields',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: PrepareStepResourcesUploadDto })
  @ApiResponse({
    status: 200,
    description: 'Presigned URLs generated successfully',
    type: PrepareStepResourcesUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async prepareStepResourcesUpload(
    @UserDecorator() user: UserEntity | null,
    @Body() prepareDto: PrepareStepResourcesUploadDto,
    @Token() token: string,
  ): Promise<PrepareStepResourcesUploadResponseDto> {
    if (!token) {
      throw new BadRequestException('JWT token is required');
    }
    const userId = user?.id || null;
    return await this.recipeService.prepareStepResourcesUpload(userId, prepareDto, token);
  }

  @Post('mark-uploaded/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark media as uploaded',
    description:
      'Mark a media file as successfully uploaded after direct upload to S3/MinIO using presigned URL. Use for both recipe images and step resources.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'mediaId',
    type: String,
    description: 'Media ID from prepare-upload or prepare-step-resources-upload response',
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
    await this.recipeService.markMediaAsUploaded(mediaId, token);
    return { success: true };
  }

  @Post('create-with-media-ids')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create recipe with media IDs (safe upload workflow)',
    description:
      '**Safe two-phase upload workflow:**\n\n' +
      '1. Call POST /recipes/prepare-upload to get presigned URLs for images\n' +
      '2. Call POST /recipes/prepare-step-resources-upload to get presigned URLs for step resources\n' +
      '3. Upload files directly to S3/MinIO using presigned URLs (PUT request)\n' +
      '4. Call POST /recipes/mark-uploaded/:mediaId for each uploaded file\n' +
      '5. Call this endpoint to create recipe with mediaIds (recipe is created but not finalized)\n' +
      '6. Call POST /recipes/confirm-upload/:recipeId to finalize recipe with URLs\n\n' +
      '**Benefits:**\n' +
      '- Recipe is created first, files are linked via mediaId\n' +
      '- If upload fails, recipe can be deleted\n' +
      '- Transactional safety',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateRecipeWithMediaIdsDto })
  @ApiResponse({
    status: 201,
    description: 'Recipe created with mediaIds (not finalized yet)',
    type: RecipeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'RecipeType or Product not found' })
  async createWithMediaIds(
    @UserDecorator() user: UserEntity | null,
    @Body() createDto: CreateRecipeWithMediaIdsDto,
  ): Promise<RecipeResponseDto> {
    const userId = user?.id || null;
    const recipe = await this.recipeService.createWithMediaIds(userId, createDto);
    return RecipeMapper.toResponseDto(recipe);
  }

  @Post('confirm-upload/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm upload and finalize recipe',
    description:
      'Finalize recipe after all files are uploaded. Converts mediaIds to URLs.\n\n' +
      '**This endpoint:**\n' +
      '- Validates that all media files are loaded\n' +
      '- Updates recipe with actual URLs\n' +
      '- Clears mediaIds (recipe is finalized)\n\n' +
      '**If validation fails:** Recipe remains with mediaIds, can be deleted or retried.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe ID from create-with-media-ids' })
  @ApiBody({ type: ConfirmRecipeUploadDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe finalized successfully with URLs',
    type: RecipeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - some files not loaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async confirmUpload(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() confirmDto: ConfirmRecipeUploadDto,
    @Token() token: string,
  ): Promise<RecipeResponseDto> {
    if (!token) {
      throw new BadRequestException('JWT token is required');
    }
    const recipe = await this.recipeService.confirmUpload(recipeId, confirmDto, token);
    return RecipeMapper.toResponseDto(recipe);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new recipe (legacy - direct URLs)',
    description:
      'Create a new recipe with image URLs (legacy method). For safe upload workflow, use POST /recipes/create-with-media-ids.\n\n' +
      '**Two methods for providing images:**\n\n' +
      '**Method 1: Direct URL (for external images)**\n' +
      '- Use JSON format with `image.cover` and `image.preview` URLs\n\n' +
      '**Method 2: Presigned URL Upload (recommended for file uploads)**\n' +
      '- Call POST /recipes/prepare-upload first to get presigned URLs\n' +
      '- Upload files directly to S3/MinIO using presigned URLs (PUT request)\n' +
      '- Call POST /recipes/mark-uploaded/:mediaId for each uploaded file\n' +
      '- Use returned URLs in `image.cover` and `image.preview` fields\n\n' +
      '**For step resources (images/videos in steps):**\n' +
      '- Use direct URLs in `stepsConfig.steps[].resources[].source`\n' +
      '- Or call POST /recipes/prepare-step-resources-upload to get presigned URLs\n' +
      '- Upload files and mark as uploaded, then use returned URLs in resources',
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
