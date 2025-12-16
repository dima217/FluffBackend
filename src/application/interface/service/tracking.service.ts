import { Tracking } from '@domain/entities/tracking.entity';
import { CreateTrackingDto, UpdateTrackingDto, DayStatisticsResponseDto } from '@application/dto/tracking.dto';

export interface ITrackingService {
	create(createDto: CreateTrackingDto): Promise<Tracking>;
	findOne(id: number): Promise<Tracking>;
	findAll(): Promise<Tracking[]>;
	update(id: number, updateDto: UpdateTrackingDto): Promise<Tracking>;
	delete(id: number): Promise<void>;
	getDayStatistics(dateStart: string, dateEnd: string): Promise<DayStatisticsResponseDto>;
}

