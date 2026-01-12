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
  PrepareVideoUploadDto,
  PrepareVideoUploadResponseDto,
  ConfirmRecipeUploadDto,
} from '@application/dto/recipe.dto';
import { RecipeMapper } from '@application/mapper/recipe.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { Token } from '@infrastructure/decorator/token.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';
import { PaginationQueryDto, PaginatedResponseDto } from '@application/dto/pagination.dto';

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
      'Mark a media file as successfully uploaded after direct upload to S3/MinIO using presigned URL. Use for recipe images, step resources, and promotional video.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'mediaId',
    type: String,
    description:
      'Media ID from prepare-upload, prepare-step-resources-upload, or prepare-video-upload response',
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
  @ApiOperation({
    summary: 'Get all recipes',
    description:
      'Retrieve all recipes with pagination support.\n\n' +
      '**Pagination:**\n' +
      '- Use `page` query parameter to specify page number (1-based, default: 1)\n' +
      '- Use `limit` query parameter to specify items per page (1-100, default: 10)\n' +
      '- Response includes `data` array and `meta` object with pagination information\n\n' +
      '**Example requests:**\n' +
      '- `GET /recipes` - Returns first 10 recipes (default)\n' +
      '- `GET /recipes?page=1&limit=20` - Returns first 20 recipes\n' +
      '- `GET /recipes?page=2&limit=10` - Returns recipes 11-20',
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
    description: 'Recipes retrieved successfully with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Array of recipes for the current page',
          items: { $ref: '#/components/schemas/RecipeResponseDto' },
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
  ): Promise<PaginatedResponseDto<RecipeResponseDto>> {
    const userId = user?.id || null;
    const page = paginationQuery.page || 1;
    const limit = paginationQuery.limit || 10;
    const result = await this.recipeService.findAll(userId, page, limit);
    const favoriteIds = await this.recipeService.getFavoriteIds(userId);
    const totalPages = Math.ceil(result.total / limit);

    return {
      data: RecipeMapper.toResponseDtoList(result.data, favoriteIds),
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
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

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Search recipes',
    description:
      'Search recipes by products and/or name. You can search by product IDs, product names, recipe name, or combine them.\n\n' +
      '**Search methods:**\n' +
      '1. **By product IDs**: Pass `productIds` parameter with comma-separated IDs (e.g., `?productIds=1,2,3`)\n' +
      '2. **By product names**: Pass `q` parameter with product names (e.g., `?q=молоко, яйца`)\n' +
      '3. **By recipe name**: Pass `q` parameter with recipe name (e.g., `?q=омлет`)\n' +
      '4. **Combined**: Pass both `productIds` and `q` to search by products AND recipe name\n\n' +
      '**Search logic:**\n' +
      '- If `productIds` is provided: searches recipes containing those products (AND with recipe name if `q` is also provided)\n' +
      '- If only `q` is provided:\n' +
      '  - First tries to find products with exact name matches\n' +
      '  - If exact matches found: returns recipes containing those products AND matching recipe name\n' +
      '  - If no exact matches: searches for partial product name matches and recipe name (OR logic)\n\n' +
      '**Examples:**\n' +
      '- `GET /recipes/search?productIds=1,2,3` - Find recipes with products 1, 2, and 3\n' +
      '- `GET /recipes/search?q=молоко, яйца` - Find recipes by product names\n' +
      '- `GET /recipes/search?productIds=1,2&q=омлет` - Find recipes with products 1,2 AND name containing "омлет"',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    required: false,
    description:
      'Search query (product names and/or recipe name, e.g., "молоко, яйца" or "омлет"). Optional if productIds is provided.',
    example: 'молоко, яйца',
  })
  @ApiQuery({
    name: 'productIds',
    type: String,
    required: false,
    description: 'Comma-separated list of product IDs (e.g., "1,2,3"). Optional if q is provided.',
    example: '1,2,3',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipes found successfully',
    type: [RecipeResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - both q and productIds are missing, or invalid productIds format',
  })
  async search(
    @Query('q') searchQuery: string | undefined,
    @Query('productIds') productIdsParam: string | undefined,
    @UserDecorator() user: UserEntity | null,
  ): Promise<RecipeResponseDto[]> {
    // Проверяем, что передан хотя бы один параметр
    if ((!searchQuery || searchQuery.trim().length === 0) && !productIdsParam) {
      throw new BadRequestException('Either search query (q) or productIds parameter is required');
    }

    // Парсим productIds если передан
    let productIds: number[] | undefined = undefined;
    if (productIdsParam) {
      productIds = productIdsParam
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

      if (productIds.length === 0) {
        throw new BadRequestException('At least one valid product ID is required');
      }
    }

    const userId = user?.id || null;
    const recipes = await this.recipeService.search(searchQuery?.trim() || '', userId, productIds);
    const favoriteIds = await this.recipeService.getFavoriteIds(userId);
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
