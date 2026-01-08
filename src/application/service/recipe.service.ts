import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IRecipeService } from '@application/interface/service/recipe.service';
import type { IRecipeRepository } from '@domain/interface/recipe.repository';
import type { IRecipeTypeRepository } from '@domain/interface/recipe-type.repository';
import type { IProductRepository } from '@domain/interface/product.repository';
import type { IUserRepository } from '@domain/interface/user.repository';
import type { IFavoriteRepository } from '@domain/interface/favorite.repository';
import { Recipe, type RecipeImage } from '@domain/entities/recipe.entity';
import { CreateRecipeDto, UpdateRecipeDto } from '@application/dto/recipe.dto';
import { RecipeMapper } from '@application/mapper/recipe.mapper';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { MediaService } from '@application/service/media.service';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class RecipeService implements IRecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    @Inject(REPOSITORY_CONSTANTS.RECIPE_REPOSITORY)
    private readonly recipeRepository: IRecipeRepository,
    @Inject(REPOSITORY_CONSTANTS.RECIPE_TYPE_REPOSITORY)
    private readonly recipeTypeRepository: IRecipeTypeRepository,
    @Inject(REPOSITORY_CONSTANTS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REPOSITORY_CONSTANTS.FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
    private readonly mediaService: MediaService,
  ) {}

  async create(userId: number | null, createDto: CreateRecipeDto): Promise<Recipe> {
    this.logger.log(`Creating recipe: ${createDto.name}`);

    const recipeType = await this.recipeTypeRepository.findOne(createDto.recipeTypeId);
    if (!recipeType) {
      throw new NotFoundException(`RecipeType with ID ${createDto.recipeTypeId} not found`);
    }

    const products = await Promise.all(
      createDto.productIds.map((id) => this.productRepository.findOne(id)),
    );

    const user = userId ? await this.userRepository.findOne(userId) : null;

    const recipe = RecipeMapper.toEntity(createDto, recipeType, products, user);
    return await this.recipeRepository.create(recipe);
  }

  async createWithFiles(
    userId: number | null,
    createDto: CreateRecipeDto,
    files: Array<MulterFile>,
    token: string,
  ): Promise<Recipe> {
    this.logger.log(`Creating recipe with files: ${createDto.name}`);

    // Validate files
    if (files.length === 0) {
      throw new BadRequestException('At least one image file must be provided');
    }

    // Find cover and preview files
    const coverFile = files.find((f) => f.fieldname === 'coverFile');
    const previewFile = files.find((f) => f.fieldname === 'previewFile');

    if (!coverFile && !previewFile) {
      throw new BadRequestException('At least one of coverFile or previewFile must be provided');
    }

    // Upload files to media service
    const imageUrls: { cover?: string; preview?: string } = {};

    if (coverFile) {
      const coverMedia = await this.mediaService.createMedia(
        {
          filename: coverFile.originalname,
          size: coverFile.size,
          metadata: {
            type: 'recipe-cover',
            userId: userId?.toString(),
          },
        },
        token,
      );
      await this.mediaService.uploadFile(coverMedia.mediaId, coverFile, token);
      await this.mediaService.markAsLoaded(coverMedia.mediaId, token);
      imageUrls.cover = coverMedia.url;
    }

    if (previewFile) {
      const previewMedia = await this.mediaService.createMedia(
        {
          filename: previewFile.originalname,
          size: previewFile.size,
          metadata: {
            type: 'recipe-preview',
            userId: userId?.toString(),
          },
        },
        token,
      );
      await this.mediaService.uploadFile(previewMedia.mediaId, previewFile, token);
      await this.mediaService.markAsLoaded(previewMedia.mediaId, token);
      imageUrls.preview = previewMedia.url;
    }

    // Merge file URLs with any existing URLs from DTO
    const cover = imageUrls.cover || createDto.image?.cover;
    const preview = imageUrls.preview || createDto.image?.preview;

    if (!cover || !preview) {
      throw new BadRequestException('Both cover and preview images are required');
    }

    const finalImageDto = {
      cover,
      preview,
    };

    // Create recipe with image URLs
    const recipeType = await this.recipeTypeRepository.findOne(createDto.recipeTypeId);
    if (!recipeType) {
      throw new NotFoundException(`RecipeType with ID ${createDto.recipeTypeId} not found`);
    }

    const products = await Promise.all(
      createDto.productIds.map((id) => this.productRepository.findOne(id)),
    );

    const user = userId ? await this.userRepository.findOne(userId) : null;

    const recipeDtoWithImages: CreateRecipeDto & { image: RecipeImage } = {
      ...createDto,
      image: finalImageDto,
    };

    const recipe = RecipeMapper.toEntity(recipeDtoWithImages, recipeType, products, user);
    return await this.recipeRepository.create(recipe);
  }

  async findOne(id: number): Promise<Recipe> {
    this.logger.log(`Finding recipe with ID: ${id}`);
    return await this.recipeRepository.findOne(id);
  }

  async findAll(userId?: number | null): Promise<Recipe[]> {
    this.logger.log('Finding all recipes');
    return await this.recipeRepository.findAll();
  }

  async findByUserId(userId: number): Promise<Recipe[]> {
    this.logger.log(`Finding recipes for user ID: ${userId}`);
    return await this.recipeRepository.findByUserId(userId);
  }

  async findFavoritesByUserId(userId: number): Promise<Recipe[]> {
    this.logger.log(`Finding favorite recipes for user ID: ${userId}`);
    const favorites = await this.favoriteRepository.findByUserId(userId);
    const recipeFavorites = favorites.filter(
      (f) => f.relatedEntityType === RelatedEntityType.RECIPE,
    );
    const recipeIds = recipeFavorites.map((f) => f.relatedEntityId);
    if (recipeIds.length === 0) {
      return [];
    }
    return await this.recipeRepository.findByIds(recipeIds);
  }

  async getFavoriteIds(userId: number | null): Promise<Set<number>> {
    if (!userId) {
      return new Set();
    }
    const favorites = await this.favoriteRepository.findByUserId(userId);
    return new Set(
      favorites
        .filter((f) => f.relatedEntityType === RelatedEntityType.RECIPE)
        .map((f) => f.relatedEntityId),
    );
  }

  async update(id: number, userId: number | null, updateDto: UpdateRecipeDto): Promise<Recipe> {
    this.logger.log(`Updating recipe with ID: ${id}`);

    const existingRecipe = await this.recipeRepository.findOne(id);

    if (userId !== null && existingRecipe.user?.id !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    const updateData: Partial<Recipe> = {};

    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }

    if (updateDto.recipeTypeId !== undefined) {
      const recipeType = await this.recipeTypeRepository.findOne(updateDto.recipeTypeId);
      if (!recipeType) {
        throw new NotFoundException(`RecipeType with ID ${updateDto.recipeTypeId} not found`);
      }
      updateData.type = recipeType;
    }

    if (updateDto.image !== undefined) {
      if (!updateDto.image.cover || !updateDto.image.preview) {
        throw new BadRequestException('Both cover and preview images are required');
      }
      updateData.image = updateDto.image as RecipeImage;
    }

    if (updateDto.promotionalVideo !== undefined) {
      updateData.promotionalVideo = updateDto.promotionalVideo || null;
    }

    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description || null;
    }

    if (updateDto.productIds !== undefined) {
      const products = await Promise.all(
        updateDto.productIds.map((productId) => this.productRepository.findOne(productId)),
      );
      updateData.products = products;
    }

    if (updateDto.fluffAt !== undefined) {
      updateData.fluffAt = updateDto.fluffAt || null;
    }

    if (updateDto.calories !== undefined) {
      updateData.calories = updateDto.calories;
    }

    if (updateDto.cookAt !== undefined) {
      updateData.cookAt = updateDto.cookAt;
    }

    if (updateDto.stepsConfig !== undefined) {
      updateData.stepsConfig = updateDto.stepsConfig;
    }

    return await this.recipeRepository.update(id, updateData);
  }

  async delete(id: number, userId: number | null): Promise<void> {
    this.logger.log(`Deleting recipe with ID: ${id}`);

    const existingRecipe = await this.recipeRepository.findOne(id);

    if (userId !== null && existingRecipe.user?.id !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    await this.recipeRepository.delete(id);
  }
}
