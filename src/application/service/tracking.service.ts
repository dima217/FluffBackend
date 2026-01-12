import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ITrackingService } from '@application/interface/service/tracking.service';
import type { ITrackingRepository } from '@domain/interface/tracking.repository';
import type { IUserRepository } from '@domain/interface/user.repository';
import type { IRecipeRepository } from '@domain/interface/recipe.repository';
import { Tracking } from '@domain/entities/tracking.entity';
import {
  CreateTrackingDto,
  UpdateTrackingDto,
  DayStatisticsResponseDto,
  CalendarTrackingResponseDto,
  DayTrackingDto,
  TrackingResponseDto,
} from '@application/dto/tracking.dto';
import { TrackingMapper } from '@application/mapper/tracking.mapper';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class TrackingService implements ITrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly cachePrefix = 'tracking:statistics';
  private readonly cacheKeysListKey = 'tracking:statistics:keys';

  constructor(
    @Inject(REPOSITORY_CONSTANTS.TRACKING_REPOSITORY)
    private readonly trackingRepository: ITrackingRepository,
    @Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REPOSITORY_CONSTANTS.RECIPE_REPOSITORY)
    private readonly recipeRepository: IRecipeRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(userId: number, dateStart: string, dateEnd: string): string {
    return `${this.cachePrefix}:${userId}:${dateStart}:${dateEnd}`;
  }

  private async addCacheKeyToList(cacheKey: string): Promise<void> {
    const keysList = await this.cacheManager.get<string[]>(this.cacheKeysListKey);
    if (keysList && keysList.includes(cacheKey)) {
      return;
    }
    const updatedKeys = keysList ? [...keysList, cacheKey] : [cacheKey];
    await this.cacheManager.set(this.cacheKeysListKey, updatedKeys);
  }

  private async invalidateStatisticsCache(): Promise<void> {
    const keysList = await this.cacheManager.get<string[]>(this.cacheKeysListKey);
    if (keysList && keysList.length > 0) {
      await Promise.all(keysList.map((key) => this.cacheManager.del(key)));
      await this.cacheManager.del(this.cacheKeysListKey);
      this.logger.debug(`Invalidated ${keysList.length} statistics cache key(s)`);
    }
  }

  async create(userId: number, createDto: CreateTrackingDto): Promise<Tracking> {
    this.logger.log(`Creating tracking for user ${userId}`);

    // Валидация: либо recipeId, либо name+calories должны быть указаны
    if (!createDto.recipeId && (!createDto.name || !createDto.calories)) {
      throw new BadRequestException('Either recipeId or both name and calories must be provided');
    }

    // Получаем пользователя
    const user = await this.userRepository.findOne(userId);

    // Если передан recipeId, получаем рецепт
    let recipe: any = null;
    if (createDto.recipeId) {
      try {
        recipe = await this.recipeRepository.findOne(createDto.recipeId);
        this.logger.log(
          `Using recipe ${recipe.id} for tracking: ${recipe.name}, ${recipe.calories} calories`,
        );
      } catch (error) {
        throw new NotFoundException(`Recipe with ID ${createDto.recipeId} not found`);
      }
    }

    const tracking = TrackingMapper.toEntity(createDto, user, recipe || null);
    const created = await this.trackingRepository.create(tracking);
    await this.invalidateStatisticsCache();
    return created;
  }

  async findOne(id: number, userId: number): Promise<Tracking> {
    this.logger.log(`Finding tracking with ID: ${id} for user ${userId}`);
    return await this.trackingRepository.findOne(id, userId);
  }

  async findAll(userId: number): Promise<Tracking[]> {
    this.logger.log(`Finding all tracking records for user ${userId}`);
    return await this.trackingRepository.findAll(userId);
  }

  async getCurrentMonthCalendar(userId: number): Promise<CalendarTrackingResponseDto> {
    this.logger.log(`Getting current month calendar for user ${userId}`);

    // Получаем первый и последний день текущего месяца
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dateStart = new Date(year, month, 1);
    const dateEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Получаем все записи за текущий месяц
    const trackings = await this.trackingRepository.findByDateRange(dateStart, dateEnd, userId);

    // Группируем по дням
    const calendar: CalendarTrackingResponseDto = {};

    for (const tracking of trackings) {
      const dateKey = tracking.created.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!calendar[dateKey]) {
        calendar[dateKey] = {
          totalCalories: 0,
          records: [],
        };
      }

      calendar[dateKey].totalCalories += Number(tracking.calories);
      calendar[dateKey].records.push(TrackingMapper.toResponseDto(tracking));
    }

    this.logger.log(`Found ${Object.keys(calendar).length} days with tracking records`);
    return calendar;
  }

  async update(id: number, userId: number, updateDto: UpdateTrackingDto): Promise<Tracking> {
    this.logger.log(`Updating tracking with ID: ${id} for user ${userId}`);
    const updateData: Partial<Tracking> = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.calories !== undefined) {
      updateData.calories = updateDto.calories;
    }
    const updated = await this.trackingRepository.update(id, updateData, userId);
    await this.invalidateStatisticsCache();
    return updated;
  }

  async delete(id: number, userId: number): Promise<void> {
    this.logger.log(`Deleting tracking with ID: ${id} for user ${userId}`);
    await this.trackingRepository.delete(id, userId);
    await this.invalidateStatisticsCache();
  }

  async getDayStatistics(
    userId: number,
    dateStart: string,
    dateEnd: string,
  ): Promise<DayStatisticsResponseDto> {
    this.logger.log(`Getting day statistics for user ${userId} from ${dateStart} to ${dateEnd}`);
    const cacheKey = this.getCacheKey(userId, dateStart, dateEnd);

    const cached = await this.cacheManager.get<DayStatisticsResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for statistics: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss for statistics: ${cacheKey}, fetching from database`);
    const startDate = new Date(dateStart);
    const endDate = new Date(dateEnd);

    const statistics = await this.trackingRepository.getDateStatistics(startDate, endDate, userId);
    const response: DayStatisticsResponseDto = {
      totalCalories: statistics.totalCalories,
      dateStart,
      dateEnd,
    };

    await this.cacheManager.set(cacheKey, response);
    await this.addCacheKeyToList(cacheKey);
    this.logger.debug(`Cached statistics for: ${cacheKey}`);
    return response;
  }
}
