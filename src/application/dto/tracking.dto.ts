import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrackingDto {
	@ApiProperty({ example: 'Breakfast', description: 'Tracking name' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ example: 500, description: 'Calories' })
	@IsNumber()
	@Min(0.01)
	calories: number;
}

export class UpdateTrackingDto {
	@ApiPropertyOptional({ example: 'Breakfast', description: 'Tracking name' })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;

	@ApiPropertyOptional({ example: 500, description: 'Calories' })
	@IsOptional()
	@IsNumber()
	@Min(0.01)
	calories?: number;
}

export class TrackingResponseDto {
	@ApiProperty({ example: 1, description: 'Tracking ID' })
	id: number;

	@ApiProperty({ example: 'Breakfast', description: 'Tracking name' })
	name: string;

	@ApiProperty({ example: 500, description: 'Calories' })
	calories: number;

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
	created: Date;
}

export class DayStatisticsDto {
	@ApiProperty({ example: '2024-01-01', description: 'Start date' })
	@IsDateString()
	dateStart: string;

	@ApiProperty({ example: '2024-01-31', description: 'End date' })
	@IsDateString()
	dateEnd: string;
}

export class DayStatisticsResponseDto {
	@ApiProperty({ example: 2500, description: 'Total calories for the period' })
	totalCalories: number;

	@ApiProperty({ example: '2024-01-01', description: 'Start date' })
	dateStart: string;

	@ApiProperty({ example: '2024-01-31', description: 'End date' })
	dateEnd: string;
}

