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
import {
  CreateRecipeDto,
  CreateRecipeWithMediaIdsDto,
  UpdateRecipeDto,
  PrepareUploadDto,
  PrepareUploadResponseDto,
  PrepareStepResourcesUploadDto,
  PrepareStepResourcesUploadResponseDto,
  StepResourceUploadResponseDto,
  ConfirmRecipeUploadDto,
} from '@application/dto/recipe.dto';
import { RecipeMapper } from '@application/mapper/recipe.mapper';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { MediaService } from '@application/service/media.service';

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

  async createWithMediaIds(
    userId: number | null,
    createDto: CreateRecipeWithMediaIdsDto,
  ): Promise<Recipe> {
    this.logger.log(`Creating recipe with mediaIds: ${createDto.name}`);

    const recipeType = await this.recipeTypeRepository.findOne(createDto.recipeTypeId);
    if (!recipeType) {
      throw new NotFoundException(`RecipeType with ID ${createDto.recipeTypeId} not found`);
    }

    const products = await Promise.all(
      createDto.productIds.map((id) => this.productRepository.findOne(id)),
    );

    const user = userId ? await this.userRepository.findOne(userId) : null;

    // Create recipe with placeholder image URLs and mediaIds
    const recipe = RecipeMapper.toEntityWithMediaIds(createDto, recipeType, products, user);
    return await this.recipeRepository.create(recipe);
  }

  async confirmUpload(
    recipeId: number,
    confirmDto: ConfirmRecipeUploadDto,
    token: string,
  ): Promise<Recipe> {
    this.logger.log(`Confirming upload for recipe ID: ${recipeId}`);

    if (recipeId !== confirmDto.recipeId) {
      throw new BadRequestException('Recipe ID mismatch');
    }

    const recipe = await this.recipeRepository.findOne(recipeId);
    if (!recipe.imageMediaIds) {
      throw new BadRequestException('Recipe was not created with mediaIds');
    }

    // Get URLs for all media files
    const mediaUrls = await this.mediaService.getMediaUrls(confirmDto.mediaIds, token);

    // Check that all media files are loaded
    const notLoaded = mediaUrls.filter((m) => !m.isLoaded);
    if (notLoaded.length > 0) {
      throw new BadRequestException(
        `Some media files are not loaded: ${notLoaded.map((m) => m.mediaId).join(', ')}`,
      );
    }

    // Create map of mediaId -> URL
    const mediaUrlMap = new Map(mediaUrls.map((m) => [m.mediaId, m.url]));

    // Update recipe with URLs
    const coverUrl = mediaUrlMap.get(recipe.imageMediaIds.coverMediaId);
    const previewUrl = mediaUrlMap.get(recipe.imageMediaIds.previewMediaId);

    if (!coverUrl || !previewUrl) {
      throw new BadRequestException('Cover or preview URL not found');
    }

    // Update stepsConfig resources with URLs
    // Extract mediaIds from placeholder URLs (format: "media:mediaId")
    const updatedStepsConfig = {
      steps: recipe.stepsConfig.steps.map((step) => ({
        ...step,
        resources: step.resources.map((resource) => {
          // Extract mediaId from placeholder URL format "media:mediaId"
          if (resource.source.startsWith('media:')) {
            const resourceMediaId = resource.source.substring(6);
            if (mediaUrlMap.has(resourceMediaId)) {
              return {
                ...resource,
                source: mediaUrlMap.get(resourceMediaId)!,
              };
            }
          }
          // If it's already a URL (not a placeholder), keep it
          return resource;
        }),
      })),
    };

    const updateData: Partial<Recipe> = {
      image: {
        cover: coverUrl,
        preview: previewUrl,
      },
      imageMediaIds: null, // Clear mediaIds after successful update
      stepsConfig: updatedStepsConfig,
    };

    return await this.recipeRepository.update(recipeId, updateData);
  }

  async prepareUpload(
    userId: number | null,
    prepareDto: PrepareUploadDto,
    token: string,
  ): Promise<PrepareUploadResponseDto> {
    this.logger.log(`Preparing upload for recipe images`);

    // Create media records in parallel
    const [coverMedia, previewMedia] = await Promise.all([
      this.mediaService.createMedia(
        {
          filename: prepareDto.coverFilename,
          size: prepareDto.coverSize,
          metadata: {
            type: 'recipe-cover',
            userId: userId?.toString(),
          },
        },
        token,
      ),
      this.mediaService.createMedia(
        {
          filename: prepareDto.previewFilename,
          size: prepareDto.previewSize,
          metadata: {
            type: 'recipe-preview',
            userId: userId?.toString(),
          },
        },
        token,
      ),
    ]);

    return {
      coverMediaId: coverMedia.mediaId,
      coverUploadUrl: coverMedia.uploadUrl,
      coverUrl: coverMedia.url,
      previewMediaId: previewMedia.mediaId,
      previewUploadUrl: previewMedia.uploadUrl,
      previewUrl: previewMedia.url,
    };
  }

  async prepareStepResourcesUpload(
    userId: number | null,
    prepareDto: PrepareStepResourcesUploadDto,
    token: string,
  ): Promise<PrepareStepResourcesUploadResponseDto> {
    this.logger.log(`Preparing upload for ${prepareDto.resources.length} step resources`);

    // Create media records in parallel for all resources
    const uploadPromises = prepareDto.resources.map((resource) =>
      this.mediaService
        .createMedia(
          {
            filename: resource.filename,
            size: resource.size,
            metadata: {
              type: `recipe-step-resource-${resource.type}`,
              userId: userId?.toString(),
              position: resource.position.toString(),
            },
          },
          token,
        )
        .then((media) => ({
          mediaId: media.mediaId,
          uploadUrl: media.uploadUrl,
          url: media.url,
          position: resource.position,
          type: resource.type,
        })),
    );

    const resources = await Promise.all(uploadPromises);

    return { resources };
  }

  async markMediaAsUploaded(mediaId: string, token: string): Promise<void> {
    this.logger.log(`Marking media ${mediaId} as uploaded`);
    await this.mediaService.markAsLoaded(mediaId, token);
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
