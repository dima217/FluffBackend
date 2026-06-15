import { Recipe, type RecipeImageMediaIds, type RecipeProductGrams } from '@domain/entities/recipe.entity';
import {
  CreateRecipeDto,
  CreateRecipeWithMediaIdsDto,
  UpdateRecipeDto,
  RecipeResponseDto,
  RecipeWithUserRating,
  RecipeProductInputDto,
} from '@application/dto/recipe.dto';
import type { User } from '@domain/entities/user.entity';
import type { RecipeType } from '@domain/entities/recipe-type.entity';
import type { Product } from '@domain/entities/product.entity';

function hasUserRating(recipe: Recipe | RecipeWithUserRating): recipe is RecipeWithUserRating {
  return 'userRating' in recipe;
}

function buildProductGrams(products?: RecipeProductInputDto[]): RecipeProductGrams[] | null {
  if (!products || products.length === 0) return null;
  const result = products
    .filter((p) => p.grams != null)
    .map((p) => ({ productId: p.id, grams: p.grams!, unit: p.unit }));
  return result.length > 0 ? result : null;
}

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
      productGrams: buildProductGrams(createDto.products),
      customProducts:
        createDto.customProducts && createDto.customProducts.length > 0
          ? createDto.customProducts
          : null,
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
    const stepsConfigWithPlaceholders = {
      steps: createDto.stepsConfig.steps.map((step) => ({
        name: step.name,
        description: step.description,
        resources: step.resources.map((resource) => ({
          position: resource.position,
          source: `media:${resource.mediaId}`,
          type: resource.type,
        })),
      })),
    };

    let promotionalVideo: string | null = null;
    let promotionalVideoMediaId: string | null = null;

    if (createDto.promotionalVideoMediaId) {
      promotionalVideo = `media:${createDto.promotionalVideoMediaId}`;
      promotionalVideoMediaId = createDto.promotionalVideoMediaId;
    }

    return {
      user: user || null,
      name: createDto.name,
      type: recipeType,
      average: 0,
      image: {
        cover: `media:${createDto.imageMediaIds.coverMediaId}`,
        preview: `media:${createDto.imageMediaIds.previewMediaId}`,
      },
      imageMediaIds: {
        coverMediaId: createDto.imageMediaIds.coverMediaId,
        previewMediaId: createDto.imageMediaIds.previewMediaId,
      } as RecipeImageMediaIds,
      promotionalVideo,
      promotionalVideoMediaId,
      description: createDto.description || null,
      products,
      productGrams: buildProductGrams(createDto.products),
      customProducts:
        createDto.customProducts && createDto.customProducts.length > 0
          ? createDto.customProducts
          : null,
      isFluff: createDto.isFluff,
      calories: createDto.calories,
      cookAt: createDto.cookAt,
      stepsConfig: stepsConfigWithPlaceholders,
      makePublic: createDto.makePublic,
      submitToSystem: createDto.submitToSystem,
    } as Recipe;
  }

  static toResponseDto(
    recipe: Recipe | RecipeWithUserRating,
    favoriteIds?: Set<number>,
  ): RecipeResponseDto {
    const productGramsMap = new Map<number, number>(
      (recipe.productGrams || []).map((pg) => [pg.productId, pg.grams]),
    );

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
      products: (recipe.products || []).map((p) => {
        const pg = recipe.productGrams?.find((g) => g.productId === p.id);
        return {
          id: p.id,
          name: p.name,
          calories: Number(p.calories),
          massa: Number(p.massa),
          image: p.image ?? null,
          countFavorites: p.countFavorites,
          isFluff: p.isFluff,
          createdAt: p.createdAt,
          grams: pg?.grams,
          unit: pg?.unit,
        };
      }),
      customProducts: (recipe.customProducts || []).map((cp) =>
        typeof cp === 'string' ? { name: cp } : cp,
      ),
      isFluff: recipe.isFluff,
      calories: Number(recipe.calories),
      cookAt: recipe.cookAt,
      stepsConfig: recipe.stepsConfig,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      userRating: hasUserRating(recipe) ? recipe.userRating : null,
    };
  }

  static toResponseDtoList(recipes: Recipe[], favoriteIds?: Set<number>): RecipeResponseDto[] {
    return recipes.map((recipe) => this.toResponseDto(recipe, favoriteIds));
  }
}
