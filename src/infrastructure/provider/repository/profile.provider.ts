import { Provider } from '@nestjs/common';
import { ProfileRepositoryAdapter } from './profile.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const profileRepository: Provider[] = [
  {
    provide: REPOSITORY_CONSTANTS.PROFILE_REPOSITORY,
    useClass: ProfileRepositoryAdapter,
  },
];
