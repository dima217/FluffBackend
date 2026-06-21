import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAchievementRepository } from '@domain/interface/achievement.repository';
import type { IRecipeRepository } from '@domain/interface/recipe.repository';
import type { ITrackingRepository } from '@domain/interface/tracking.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { AchievementResponseDto } from '@application/dto/achievement.dto';
import {
  ACHIEVEMENT_META,
  AchievementCode,
  AchievementCodeValue,
} from '@application/constants/achievement.constants';
import { PushEventsService } from './push-event.service';
import {
  PushNotificationType,
  buildAchievementUnlockedData,
} from '@application/constants/push-notification.types';
import type { Recipe } from '@domain/entities/recipe.entity';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @Inject(REPOSITORY_CONSTANTS.ACHIEVEMENT_REPOSITORY)
    private readonly achievementRepository: IAchievementRepository,
    @Inject(REPOSITORY_CONSTANTS.RECIPE_REPOSITORY)
    private readonly recipeRepository: IRecipeRepository,
    @Inject(REPOSITORY_CONSTANTS.TRACKING_REPOSITORY)
    private readonly trackingRepository: ITrackingRepository,
    private readonly pushEventsService: PushEventsService,
  ) {}

  async getUserAchievements(userId: number): Promise<AchievementResponseDto[]> {
    await this.syncProgress(userId);
    const items = await this.achievementRepository.findUserAchievements(userId);
    return items.map(({ achievement, unlockedAt }) => ({
      id: achievement.id,
      code: achievement.code,
      icon: achievement.icon,
      unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
    }));
  }

  async onAccountCreated(userId: number): Promise<void> {
    await this.safe(() => this.tryUnlock(userId, AchievementCode.CREATED_ACCOUNT));
  }

  async onRecipeCreated(userId: number | null, recipe: Recipe): Promise<void> {
    if (!userId) return;
    await this.safe(async () => {
      const recipes = await this.recipeRepository.findByUserId(userId);
      if (recipes.length >= 1) {
        await this.tryUnlock(userId, AchievementCode.FIRST_RECIPE);
      }
      if (recipes.length >= 10) {
        await this.tryUnlock(userId, AchievementCode.TEN_RECIPES);
      }
      if (recipe.makePublic) {
        await this.tryUnlock(userId, AchievementCode.PUBLIC_RECIPE);
      }
    });
  }

  async onRecipeUpdated(userId: number | null, recipe: Recipe): Promise<void> {
    if (!userId || !recipe.makePublic) return;
    await this.safe(() => this.tryUnlock(userId, AchievementCode.PUBLIC_RECIPE));
  }

  async onRecipeRated(userId: number, isNewRating: boolean): Promise<void> {
    if (!isNewRating) return;
    await this.safe(() => this.tryUnlock(userId, AchievementCode.FIRST_RATE));
  }

  async onTrackingCreated(userId: number): Promise<void> {
    await this.safe(() => this.checkPerfectMonth(userId));
  }

  async syncProgress(userId: number): Promise<void> {
    await this.safe(async () => {
      await this.tryUnlock(userId, AchievementCode.CREATED_ACCOUNT);

      const recipes = await this.recipeRepository.findByUserId(userId);
      if (recipes.length >= 1) {
        await this.tryUnlock(userId, AchievementCode.FIRST_RECIPE);
      }
      if (recipes.length >= 10) {
        await this.tryUnlock(userId, AchievementCode.TEN_RECIPES);
      }
      if (recipes.some((recipe) => recipe.makePublic)) {
        await this.tryUnlock(userId, AchievementCode.PUBLIC_RECIPE);
      }

      const ratingsCount = await this.achievementRepository.countRatingsByUser(userId);
      if (ratingsCount >= 1) {
        await this.tryUnlock(userId, AchievementCode.FIRST_RATE);
      }

      await this.checkPerfectMonth(userId);
      await this.checkAllAchievements(userId);
    });
  }

  private async checkPerfectMonth(userId: number): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();

    const records = await this.trackingRepository.findByDateRange(
      monthStart,
      monthEnd,
      userId,
    );

    const uniqueDays = new Set(
      records.map((record) => {
        const date = new Date(record.created);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }),
    );

    if (uniqueDays.size >= daysInMonth) {
      await this.tryUnlock(userId, AchievementCode.PERFECT_MONTH_TRACKING);
    }
  }

  private async checkAllAchievements(userId: number): Promise<void> {
    const all = await this.achievementRepository.findAllActive();
    const regular = all.filter(
      (achievement) => achievement.code !== AchievementCode.ALL_ACHIEVEMENTS,
    );

    const unlockedCount = await this.achievementRepository.countUnlockedByUser(userId);
    const allAchievement = all.find(
      (achievement) => achievement.code === AchievementCode.ALL_ACHIEVEMENTS,
    );
    const hasAllMeta = allAchievement
      ? await this.achievementRepository.hasUnlocked(userId, allAchievement.id)
      : false;

    const regularUnlocked = hasAllMeta ? unlockedCount - 1 : unlockedCount;
    if (regularUnlocked >= regular.length) {
      await this.tryUnlock(userId, AchievementCode.ALL_ACHIEVEMENTS);
    }
  }

  private async tryUnlock(userId: number, code: AchievementCodeValue): Promise<void> {
    const achievement = await this.achievementRepository.findByCode(code);
    if (!achievement) return;

    const alreadyUnlocked = await this.achievementRepository.hasUnlocked(
      userId,
      achievement.id,
    );
    if (alreadyUnlocked) return;

    await this.achievementRepository.unlock(userId, achievement.id);

    const meta = ACHIEVEMENT_META[code];
    await this.pushEventsService.notifyAchievementUnlocked(
      userId,
      code,
      meta.title,
      meta.body,
    );

    if (code !== AchievementCode.ALL_ACHIEVEMENTS) {
      await this.checkAllAchievements(userId);
    }
  }

  private async safe(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.logger.warn(
        `Achievement processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
