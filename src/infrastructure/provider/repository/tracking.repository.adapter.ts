import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Tracking } from '@domain/entities/tracking.entity';
import { ITrackingRepository } from '@domain/interface/tracking.repository';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class TrackingRepositoryAdapter implements ITrackingRepository {
	private repository: Repository<Tracking>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Tracking);
	}

	async create(tracking: Tracking): Promise<Tracking> {
		const newTracking = this.repository.create(tracking);
		return await this.repository.save(newTracking);
	}

	async findOne(id: number, userId?: number): Promise<Tracking> {
		const where: any = { id };
		if (userId !== undefined) {
			where.user = { id: userId };
		}
		const tracking = await this.repository.findOne({
			where,
			relations: ['user', 'recipe'],
		});
		if (!tracking) {
			throw new NotFoundEntityException('Tracking');
		}
		return tracking;
	}

	async findAll(userId?: number): Promise<Tracking[]> {
		const where = userId !== undefined ? { user: { id: userId } } : {};
		return await this.repository.find({
			where,
			relations: ['user', 'recipe'],
			order: { created: 'DESC' },
		});
	}

	async findAllPaginated(
		page: number,
		limit: number,
		userId?: number,
	): Promise<{ data: Tracking[]; total: number }> {
		const where = userId !== undefined ? { user: { id: userId } } : {};
		const skip = (page - 1) * limit;
		const [data, total] = await this.repository.findAndCount({
			where,
			skip,
			take: limit,
			relations: ['user', 'recipe'],
			order: { created: 'DESC' },
		});
		return { data, total };
	}

	async findByDateRange(dateStart: Date, dateEnd: Date, userId: number): Promise<Tracking[]> {
		return await this.repository
			.createQueryBuilder('tracking')
			.leftJoinAndSelect('tracking.user', 'user')
			.leftJoinAndSelect('tracking.recipe', 'recipe')
			.where('tracking.user_id = :userId', { userId })
			.andWhere('DATE(tracking.created) >= DATE(:dateStart)', { dateStart })
			.andWhere('DATE(tracking.created) <= DATE(:dateEnd)', { dateEnd })
			.orderBy('tracking.created', 'ASC')
			.getMany();
	}

	async update(id: number, tracking: Partial<Tracking>, userId?: number): Promise<Tracking> {
		const existingTracking = await this.findOne(id, userId);
		Object.assign(existingTracking, tracking);
		return await this.repository.save(existingTracking);
	}

	async delete(id: number, userId?: number): Promise<void> {
		await this.findOne(id, userId);
		await this.repository.delete(id);
	}

	async getDateStatistics(
		dateStart: Date,
		dateEnd: Date,
		userId?: number,
	): Promise<{ totalCalories: number }> {
		const queryBuilder = this.repository
			.createQueryBuilder('tracking')
			.select('COALESCE(SUM(tracking.calories), 0)', 'total')
			.where('tracking.created >= :dateStart', { dateStart })
			.andWhere('tracking.created <= :dateEnd', { dateEnd });

		if (userId !== undefined) {
			queryBuilder.andWhere('tracking.user_id = :userId', { userId });
		}

		const result = await queryBuilder.getRawOne();

		return {
			totalCalories: Number(result?.total || 0),
		};
	}
}

