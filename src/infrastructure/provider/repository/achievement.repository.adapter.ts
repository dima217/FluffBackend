import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Achievement } from '@domain/entities/achievement.entity';
import { UserAchievement } from '@domain/entities/user-achievement.entity';
import { RecipeRating } from '@domain/entities/recipe.rating.entity';
import {
  AchievementWithUnlock,
  IAchievementRepository,
} from '@domain/interface/achievement.repository';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class AchievementRepositoryAdapter implements IAchievementRepository {
  private achievementRepository: Repository<Achievement>;
  private userAchievementRepository: Repository<UserAchievement>;
  private ratingRepository: Repository<RecipeRating>;

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
    this.achievementRepository = this.dataSource.getRepository(Achievement);
    this.userAchievementRepository = this.dataSource.getRepository(UserAchievement);
    this.ratingRepository = this.dataSource.getRepository(RecipeRating);
  }

  async findAllActive(): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Achievement | null> {
    return this.achievementRepository.findOne({ where: { code } });
  }

  async findUserAchievements(userId: number): Promise<AchievementWithUnlock[]> {
    const achievements = await this.findAllActive();
    const unlocked = await this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
    });

    const unlockedMap = new Map(
      unlocked.map((item) => [item.achievementId, item.unlockedAt]),
    );

    return achievements.map((achievement) => ({
      achievement,
      unlockedAt: unlockedMap.get(achievement.id) ?? null,
    }));
  }

  async hasUnlocked(userId: number, achievementId: number): Promise<boolean> {
    const count = await this.userAchievementRepository.count({
      where: { userId, achievementId },
    });
    return count > 0;
  }

  async unlock(userId: number, achievementId: number): Promise<UserAchievement> {
    const entity = this.userAchievementRepository.create({
      userId,
      achievementId,
    });
    return this.userAchievementRepository.save(entity);
  }

  async countUnlockedByUser(userId: number): Promise<number> {
    return this.userAchievementRepository.count({ where: { userId } });
  }

  async countRatingsByUser(userId: number): Promise<number> {
    return this.ratingRepository.count({
      where: { user: { id: userId } },
    });
  }
}
