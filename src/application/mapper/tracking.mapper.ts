import { Tracking } from '@domain/entities/tracking.entity';
import { CreateTrackingDto, TrackingResponseDto } from '@application/dto/tracking.dto';
import type { User } from '@domain/entities/user.entity';
import type { Recipe } from '@domain/entities/recipe.entity';

/**
 * Calculates the total gram weight of a recipe from its productGrams + customProducts.
 * Returns 0 if no gram data is available.
 */
function calcRecipeTotalWeight(recipe: Recipe): number {
  const fromProducts = (recipe.productGrams ?? []).reduce((sum, pg) => sum + (pg.grams ?? 0), 0);
  const fromCustom = (recipe.customProducts ?? []).reduce((sum, cp) => sum + (cp.grams ?? 0), 0);
  return fromProducts + fromCustom;
}

export class TrackingMapper {
  static toEntity(
    createDto: CreateTrackingDto,
    user: User,
    recipe: Recipe | null = null,
    scaledNutrition?: { calories: number; proteins: number | null; fats: number | null; carbs: number | null },
  ): Tracking {
    if (recipe) {
      const nutrition = scaledNutrition ?? {
        calories: recipe.calories,
        proteins: recipe.proteins ?? null,
        fats: recipe.fats ?? null,
        carbs: recipe.carbs ?? null,
      };
      return {
        user,
        name: recipe.name,
        calories: nutrition.calories,
        proteins: nutrition.proteins,
        fats: nutrition.fats,
        carbs: nutrition.carbs,
        recipe,
        created: createDto.created ? new Date(createDto.created) : new Date(),
      } as Tracking;
    }

    return {
      user,
      name: createDto.name ?? '',
      calories: createDto.calories ?? 0,
      proteins: createDto.proteins ?? null,
      fats: createDto.fats ?? null,
      carbs: createDto.carbs ?? null,
      recipe: null,
      created: createDto.created ? new Date(createDto.created) : new Date(),
    } as Tracking;
  }

  static scaleRecipeNutrition(
    recipe: Recipe,
    grams: number,
  ): { calories: number; proteins: number | null; fats: number | null; carbs: number | null } {
    const totalWeight = calcRecipeTotalWeight(recipe);

    if (totalWeight <= 0) {
      return {
        calories: recipe.calories,
        proteins: recipe.proteins ?? null,
        fats: recipe.fats ?? null,
        carbs: recipe.carbs ?? null,
      };
    }

    const ratio = grams / totalWeight;
    return {
      calories: Math.round(recipe.calories * ratio),
      proteins: recipe.proteins != null ? Math.round(Number(recipe.proteins) * ratio * 10) / 10 : null,
      fats: recipe.fats != null ? Math.round(Number(recipe.fats) * ratio * 10) / 10 : null,
      carbs: recipe.carbs != null ? Math.round(Number(recipe.carbs) * ratio * 10) / 10 : null,
    };
  }

  static toResponseDto(tracking: Tracking): TrackingResponseDto {
    return {
      id: tracking.id,
      name: tracking.name,
      calories: Number(tracking.calories),
      proteins: tracking.proteins != null ? Number(tracking.proteins) : null,
      fats: tracking.fats != null ? Number(tracking.fats) : null,
      carbs: tracking.carbs != null ? Number(tracking.carbs) : null,
      recipeId: tracking.recipe?.id ?? null,
      created: tracking.created,
    };
  }
}
