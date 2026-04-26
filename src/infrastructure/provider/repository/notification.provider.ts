import { Provider } from '@nestjs/common';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { NotificationRepositoryAdapter } from './notification.repository.adapter';

export const notificarionRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.NOTIFICATION_REPOSITORY,
		useClass: NotificationRepositoryAdapter,
	},
];

