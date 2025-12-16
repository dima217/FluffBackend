import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ITrackingService } from '@application/interface/service/tracking.service';
import type { ITrackingRepository } from '@domain/interface/tracking.repository';
import { Tracking } from '@domain/entities/tracking.entity';
import { CreateTrackingDto, UpdateTrackingDto, DayStatisticsResponseDto } from '@application/dto/tracking.dto';
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
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) { }

	private getCacheKey(dateStart: string, dateEnd: string): string {
		return `${this.cachePrefix}:${dateStart}:${dateEnd}`;
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

	async create(createDto: CreateTrackingDto): Promise<Tracking> {
		this.logger.log(`Creating tracking: ${createDto.name}`);
		const tracking = TrackingMapper.toEntity(createDto);
		const created = await this.trackingRepository.create(tracking);
		await this.invalidateStatisticsCache();
		return created;
	}

	async findOne(id: number): Promise<Tracking> {
		this.logger.log(`Finding tracking with ID: ${id}`);
		return await this.trackingRepository.findOne(id);
	}

	async findAll(): Promise<Tracking[]> {
		this.logger.log('Finding all tracking records');
		return await this.trackingRepository.findAll();
	}

	async update(id: number, updateDto: UpdateTrackingDto): Promise<Tracking> {
		this.logger.log(`Updating tracking with ID: ${id}`);
		const updateData: Partial<Tracking> = {};
		if (updateDto.name !== undefined) {
			updateData.name = updateDto.name;
		}
		if (updateDto.calories !== undefined) {
			updateData.calories = updateDto.calories;
		}
		const updated = await this.trackingRepository.update(id, updateData);
		await this.invalidateStatisticsCache();
		return updated;
	}

	async delete(id: number): Promise<void> {
		this.logger.log(`Deleting tracking with ID: ${id}`);
		await this.trackingRepository.delete(id);
		await this.invalidateStatisticsCache();
	}

	async getDayStatistics(dateStart: string, dateEnd: string): Promise<DayStatisticsResponseDto> {
		this.logger.log(`Getting day statistics from ${dateStart} to ${dateEnd}`);
		const cacheKey = this.getCacheKey(dateStart, dateEnd);

		const cached = await this.cacheManager.get<DayStatisticsResponseDto>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for statistics: ${cacheKey}`);
			return cached;
		}

		this.logger.debug(`Cache miss for statistics: ${cacheKey}, fetching from database`);
		const startDate = new Date(dateStart);
		const endDate = new Date(dateEnd);

		const statistics = await this.trackingRepository.getDateStatistics(startDate, endDate);
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

