import { Provider } from '@nestjs/common';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { AchievementRepositoryAdapter } from './achievement.repository.adapter';

export const achievementRepository: Provider[] = [
  {
    provide: REPOSITORY_CONSTANTS.ACHIEVEMENT_REPOSITORY,
    useClass: AchievementRepositoryAdapter,
  },
];
