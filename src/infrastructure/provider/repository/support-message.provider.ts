import { Provider } from '@nestjs/common';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { SupportMessageRepositoryAdapter } from './support-message.repository.adapter';

export const supportMessageRepository: Provider[] = [
  {
    provide: REPOSITORY_CONSTANTS.SUPPORT_MESSAGE_REPOSITORY,
    useClass: SupportMessageRepositoryAdapter,
  },
];
