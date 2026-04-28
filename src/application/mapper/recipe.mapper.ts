import { Recipe, type RecipeImageMediaIds } from '@domain/entities/recipe.entity';
import {
  CreateRecipeDto,
  CreateRecipeWithMediaIdsDto,
  UpdateRecipeDto,
  RecipeResponseDto,
} from '@application/dto/recipe.dto';
import type { User } from '@domain/entities/user.entity';
import type { RecipeType } from '@domain/entities/recipe-type.entity';
import type { Product } from '@domain/entities/product.entity';
import { ProductResponseDto } from '@application/dto';

export class RecipeMapper {
  static toEntity(
    createDto: CreateRecipeDto,
    recipeType: RecipeType,
    products: Product[],
    user?: User | null,
  ): Recipe {
    return {
      user: user || null,
      name: createDto.name,
      type: recipeType,
      average: 0,
      image: createDto.image,
      imageMediaIds: null,
      promotionalVideo: createDto.promotionalVideo || null,
      description: createDto.description || null,
      products,
      customProducts: createDto.customProducts && createDto.customProducts.length > 0 ? createDto.customProducts : null,
      isFluff: createDto.isFluff || null,
      calories: createDto.calories,
      cookAt: createDto.cookAt,
      stepsConfig: createDto.stepsConfig,
      makePublic: createDto.makePublic,
      submitToSystem: createDto.submitToSystem,
    } as Recipe;
  }

  static toEntityWithMediaIds(
    createDto: CreateRecipeWithMediaIdsDto,
    recipeType: RecipeType,
    products: Product[],
    user?: User | null,
  ): Recipe {
    // Convert stepsConfig with mediaIds to format with placeholder URLs
    const stepsConfigWithPlaceholders = {
      steps: createDto.stepsConfig.steps.map((step) => ({
        name: step.name,
        description: step.description,
        resources: step.resources.map((resource) => ({
          position: resource.position,
          source: `media:${resource.mediaId}`, // Placeholder format
          type: resource.type,
        })),
      })),
    };

    // Handle promotionalVideo: use mediaId if provided
    let promotionalVideo: string | null = null;
    let promotionalVideoMediaId: string | null = null;

    if (createDto.promotionalVideoMediaId) {
      promotionalVideo = `media:${createDto.promotionalVideoMediaId}`; // Placeholder
      promotionalVideoMediaId = createDto.promotionalVideoMediaId;
    }

    return {
      user: user || null,
      name: createDto.name,
      type: recipeType,
      average: 0,
      image: {
        cover: `media:${createDto.imageMediaIds.coverMediaId}`, // Placeholder
        preview: `media:${createDto.imageMediaIds.previewMediaId}`, // Placeholder
      },
      imageMediaIds: {
        coverMediaId: createDto.imageMediaIds.coverMediaId,
        previewMediaId: createDto.imageMediaIds.previewMediaId,
      } as RecipeImageMediaIds,
      promotionalVideo,
      promotionalVideoMediaId,
      description: createDto.description || null,
      products,
      customProducts: createDto.customProducts && createDto.customProducts.length > 0 ? createDto.customProducts : null,
      isFluff: createDto.isFluff,
      calories: createDto.calories,
      cookAt: createDto.cookAt,
      stepsConfig: stepsConfigWithPlaceholders,
      makePublic: createDto.makePublic,
      submitToSystem: createDto.submitToSystem,
    } as Recipe;
  }

  static toResponseDto(recipe: Recipe, favoriteIds?: Set<number>): RecipeResponseDto {
    return {
      id: recipe.id,
      user: recipe.user
        ? {
            id: recipe.user.id,
            firstName: recipe.user.firstName,
            lastName: recipe.user.lastName,
          }
        : null,
      name: recipe.name,
      type: {
        id: recipe.type.id,
        name: recipe.type.name,
      },
      average: Number(recipe.average),
      favorite: favoriteIds ? favoriteIds.has(recipe.id) : false,
      image: recipe.image,
      promotionalVideo: recipe.promotionalVideo,
      description: recipe.description,
      products: recipe.products?.map((p) => p as unknown as ProductResponseDto) || [],
      customProducts: recipe.customProducts || [],
      isFluff: recipe.isFluff,
      calories: Number(recipe.calories),
      cookAt: recipe.cookAt,
      stepsConfig: recipe.stepsConfig,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  static toResponseDtoList(recipes: Recipe[], favoriteIds?: Set<number>): RecipeResponseDto[] {
    return recipes.map((recipe) => this.toResponseDto(recipe, favoriteIds));
  }
}
