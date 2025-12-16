import { Provider } from '@nestjs/common';
import { RecipeRepositoryAdapter } from './recipe.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const recipeRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.RECIPE_REPOSITORY,
		useClass: RecipeRepositoryAdapter,
	},
];

