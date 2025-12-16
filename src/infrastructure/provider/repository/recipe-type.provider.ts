import { Provider } from '@nestjs/common';
import { RecipeTypeRepositoryAdapter } from './recipe-type.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const recipeTypeRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.RECIPE_TYPE_REPOSITORY,
		useClass: RecipeTypeRepositoryAdapter,
	},
];

