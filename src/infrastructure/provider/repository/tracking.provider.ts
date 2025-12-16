import { Provider } from '@nestjs/common';
import { TrackingRepositoryAdapter } from './tracking.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const trackingRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.TRACKING_REPOSITORY,
		useClass: TrackingRepositoryAdapter,
	},
];

