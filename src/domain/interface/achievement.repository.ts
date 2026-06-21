import { Achievement } from '@domain/entities/achievement.entity';
import { UserAchievement } from '@domain/entities/user-achievement.entity';

export interface AchievementWithUnlock {
  achievement: Achievement;
  unlockedAt: Date | null;
}

export interface IAchievementRepository {
  findAllActive(): Promise<Achievement[]>;
  findByCode(code: string): Promise<Achievement | null>;
  findUserAchievements(userId: number): Promise<AchievementWithUnlock[]>;
  hasUnlocked(userId: number, achievementId: number): Promise<boolean>;
  unlock(userId: number, achievementId: number): Promise<UserAchievement>;
  countUnlockedByUser(userId: number): Promise<number>;
  countRatingsByUser(userId: number): Promise<number>;
}
