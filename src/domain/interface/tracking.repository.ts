import { Tracking } from '@domain/entities/tracking.entity';

export interface DateStatistics {
	totalCalories: number;
}

export interface ITrackingRepository {
	create(tracking: Tracking): Promise<Tracking>;
	findOne(id: number): Promise<Tracking>;
	findAll(): Promise<Tracking[]>;
	update(id: number, tracking: Partial<Tracking>): Promise<Tracking>;
	delete(id: number): Promise<void>;
	getDateStatistics(dateStart: Date, dateEnd: Date): Promise<DateStatistics>;
}

