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

function calcRecipeNutrition(
  products: Product[],
  productGrams: RecipeProductGrams[] | null,
): { calories: number; proteins: number; fats: number; carbs: number } {
  const pgMap = new Map<number, RecipeProductGrams>((productGrams || []).map((pg) => [pg.productId, pg]));
  let calories = 0;
  let proteins = 0;
  let fats = 0;
  let carbs = 0;
  for (const p of products) {
    const pg = pgMap.get(p.id);
    const grams = pg?.grams ?? 100;
    const factor = grams / Number(p.massa || 100);
    calories += Number(p.calories) * factor;
    if (p.proteins != null) proteins += Number(p.proteins) * factor;
    if (p.fats != null) fats += Number(p.fats) * factor;
    if (p.carbs != null) carbs += Number(p.carbs) * factor;
  }
  return {
    calories: Math.round(calories),
    proteins: Math.round(proteins * 10) / 10,
    fats: Math.round(fats * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
  };
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
      ...calcRecipeNutrition(products, buildProductGrams(createDto.products)),
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
      ...calcRecipeNutrition(products, buildProductGrams(createDto.products)),
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
    const productGramsMap = new Map<number, RecipeProductGrams>(
      (recipe.productGrams || []).map((pg) => [pg.productId, pg]),
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
        const pg = productGramsMap.get(p.id);
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
      proteins: recipe.proteins != null ? Number(recipe.proteins) : null,
      fats: recipe.fats != null ? Number(recipe.fats) : null,
      carbs: recipe.carbs != null ? Number(recipe.carbs) : null,
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
