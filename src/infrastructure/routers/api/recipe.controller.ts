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
  UseInterceptors,
  UploadedFiles,
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
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RecipeService } from '@application/service/recipe.service';
import { CreateRecipeDto, UpdateRecipeDto, RecipeResponseDto } from '@application/dto/recipe.dto';
import { RecipeMapper } from '@application/mapper/recipe.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { Token } from '@infrastructure/decorator/token.decorator';
import { Public } from '@infrastructure/decorator/public.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('Recipes')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiOperation({
    summary: 'Create a new recipe',
    description:
      'Create a new recipe. You can provide images either as URLs in JSON body or as files via multipart/form-data. If files are provided, they will be uploaded to media service.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    type: CreateRecipeDto,
    description:
      'Recipe data. For file uploads, use multipart/form-data with fields: name, recipeTypeId, productIds (JSON array), calories, cookAt, stepsConfig (JSON), description (optional), promotionalVideo (optional), coverFile (file), previewFile (file). For URL-based images, use application/json with image.cover and image.preview URLs.',
  })
  @ApiResponse({ status: 201, description: 'Recipe created successfully', type: RecipeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'RecipeType or Product not found' })
  async create(
    @UserDecorator() user: UserEntity | null,
    @Body() createDto: CreateRecipeDto,
    @UploadedFiles() files?: Array<MulterFile>,
    @Token() token?: string,
  ): Promise<RecipeResponseDto> {
    const userId = user?.id || null;

    // Check if files are provided
    if (files && files.length > 0) {
      if (!token) {
        throw new BadRequestException('JWT token is required for file uploads');
      }
      const recipe = await this.recipeService.createWithFiles(userId, createDto, files, token);
      return RecipeMapper.toResponseDto(recipe);
    }

    // Validate that image URLs are provided if no files
    if (!createDto.image || (!createDto.image.cover && !createDto.image.preview)) {
      throw new BadRequestException('Either image URLs or image files must be provided');
    }

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
