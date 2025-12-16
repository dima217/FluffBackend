import { Provider } from '@nestjs/common';
import { UserRepositoryAdapter } from './user.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const userRepository: Provider[] = [
  {
    provide: REPOSITORY_CONSTANTS.USER_REPOSITORY,
    useClass: UserRepositoryAdapter,
  },
];
