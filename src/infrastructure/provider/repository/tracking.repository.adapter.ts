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

	async findOne(id: number): Promise<Tracking> {
		const tracking = await this.repository.findOne({ where: { id } });
		if (!tracking) {
			throw new NotFoundEntityException('Tracking');
		}
		return tracking;
	}

	async findAll(): Promise<Tracking[]> {
		return await this.repository.find();
	}

	async update(id: number, tracking: Partial<Tracking>): Promise<Tracking> {
		const existingTracking = await this.findOne(id);
		Object.assign(existingTracking, tracking);
		return await this.repository.save(existingTracking);
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.repository.delete(id);
	}

	async getDateStatistics(dateStart: Date, dateEnd: Date): Promise<{ totalCalories: number }> {
		const result = await this.repository
			.createQueryBuilder('tracking')
			.select('COALESCE(SUM(tracking.calories), 0)', 'total')
			.where('tracking.created >= :dateStart', { dateStart })
			.andWhere('tracking.created <= :dateEnd', { dateEnd })
			.getRawOne();

		return {
			totalCalories: Number(result?.total || 0),
		};
	}
}

