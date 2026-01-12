import { Tracking } from '@domain/entities/tracking.entity';
import {
  CreateTrackingDto,
  UpdateTrackingDto,
  DayStatisticsResponseDto,
  CalendarTrackingResponseDto,
} from '@application/dto/tracking.dto';

export interface ITrackingService {
  create(userId: number, createDto: CreateTrackingDto): Promise<Tracking>;
  findOne(id: number, userId: number): Promise<Tracking>;
  findAll(userId: number): Promise<Tracking[]>;
  getCurrentMonthCalendar(userId: number): Promise<CalendarTrackingResponseDto>;
  update(id: number, userId: number, updateDto: UpdateTrackingDto): Promise<Tracking>;
  delete(id: number, userId: number): Promise<void>;
  getDayStatistics(
    userId: number,
    dateStart: string,
    dateEnd: string,
  ): Promise<DayStatisticsResponseDto>;
}
