import { Provider } from '@nestjs/common';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { RecipeRatingRepositoryAdapter } from './rating.repository.adapter';

export const ratingRepository: Provider[] = [
  {
    provide: REPOSITORY_CONSTANTS.RATING_REPOSITORY,
    useClass: RecipeRatingRepositoryAdapter,
  },
];
