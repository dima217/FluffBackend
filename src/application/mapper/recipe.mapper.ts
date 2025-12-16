import { Recipe } from '@domain/entities/recipe.entity';
import { CreateRecipeDto, UpdateRecipeDto, RecipeResponseDto } from '@application/dto/recipe.dto';
import type { User } from '@domain/entities/user.entity';
import type { RecipeType } from '@domain/entities/recipe-type.entity';
import type { Product } from '@domain/entities/product.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

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
			promotionalVideo: createDto.promotionalVideo || null,
			description: createDto.description || null,
			products,
			fluffAt: createDto.fluffAt || null,
			calories: createDto.calories,
			cookAt: createDto.cookAt,
			stepsConfig: createDto.stepsConfig,
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
			products: recipe.products?.map((p) => p.id) || [],
			fluffAt: recipe.fluffAt,
			calories: Number(recipe.calories),
			cookAt: recipe.cookAt,
			stepsConfig: recipe.stepsConfig,
			createdAt: recipe.createdAt,
			updatedAt: recipe.updatedAt,
		};
	}

	static toResponseDtoList(
		recipes: Recipe[],
		favoriteIds?: Set<number>,
	): RecipeResponseDto[] {
		return recipes.map((recipe) => this.toResponseDto(recipe, favoriteIds));
	}
}

