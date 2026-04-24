import { Tracking } from '@domain/entities/tracking.entity';

export interface DateStatistics {
	totalCalories: number;
}

export interface ITrackingRepository {
	create(tracking: Tracking): Promise<Tracking>;
	findOne(id: number, userId?: number): Promise<Tracking>;
	findAll(userId?: number): Promise<Tracking[]>;
	findAllPaginated(
		page: number,
		limit: number,
		userId?: number,
	): Promise<{ data: Tracking[]; total: number }>;
	findByDateRange(dateStart: Date, dateEnd: Date, userId: number): Promise<Tracking[]>;
	update(id: number, tracking: Partial<Tracking>, userId?: number): Promise<Tracking>;
	delete(id: number, userId?: number): Promise<void>;
	getDateStatistics(dateStart: Date, dateEnd: Date, userId?: number): Promise<DateStatistics>;
}

