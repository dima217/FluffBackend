import { Provider } from '@nestjs/common';
import { ReviewRepositoryAdapter } from './review.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const reviewRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.REVIEW_REPOSITORY,
		useClass: ReviewRepositoryAdapter,
	},
];

