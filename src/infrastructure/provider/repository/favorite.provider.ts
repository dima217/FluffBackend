import { Provider } from '@nestjs/common';
import { FavoriteRepositoryAdapter } from './favorite.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const favoriteRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.FAVORITE_REPOSITORY,
		useClass: FavoriteRepositoryAdapter,
	},
];

