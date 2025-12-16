import { Injectable, Inject, Logger } from '@nestjs/common';
import { IFavoriteProcessStrategy } from '@application/interface/process/favorite-process.strategy';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { Favorite } from '@domain/entities/favorite.entity';
import type { IRecipeRepository } from '@domain/interface/recipe.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class RecipeFavoriteCountProcess implements IFavoriteProcessStrategy {
	readonly type: RelatedEntityType = RelatedEntityType.RECIPE;
	private readonly logger = new Logger(RecipeFavoriteCountProcess.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.RECIPE_REPOSITORY)
		private readonly recipeRepository: IRecipeRepository,
	) { }

	async executeOnCreate(favorite: Favorite): Promise<void> {
		this.logger.log(`Incrementing favorite count for recipe ID: ${favorite.relatedEntityId}`);
		const recipe = await this.recipeRepository.findOne(favorite.relatedEntityId);
		recipe.countFavorites = (recipe.countFavorites || 0) + 1;
		await this.recipeRepository.update(recipe.id, { countFavorites: recipe.countFavorites });
		this.logger.log(`Favorite count for recipe ID: ${favorite.relatedEntityId} is now ${recipe.countFavorites}`);
	}

	async executeOnDelete(favorite: Favorite): Promise<void> {
		this.logger.log(`Decrementing favorite count for recipe ID: ${favorite.relatedEntityId}`);
		const recipe = await this.recipeRepository.findOne(favorite.relatedEntityId);
		recipe.countFavorites = Math.max(0, (recipe.countFavorites || 0) - 1);
		await this.recipeRepository.update(recipe.id, { countFavorites: recipe.countFavorites });
		this.logger.log(`Favorite count for recipe ID: ${favorite.relatedEntityId} is now ${recipe.countFavorites}`);
	}
}

