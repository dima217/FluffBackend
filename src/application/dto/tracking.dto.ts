import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrackingDto {
  @ApiPropertyOptional({
    example: 'Breakfast',
    description:
      'Tracking name (required if recipeId is not provided). Can be any custom text like "хуй моржовый 100000кг"',
  })
  @ValidateIf((o) => !o.recipeId)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 500,
    description: 'Calories (required if recipeId is not provided)',
  })
  @ValidateIf((o) => !o.recipeId)
  @IsNumber()
  @Min(0.01)
  calories?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Recipe ID (optional). If provided, name and calories will be taken from the recipe. Either recipeId or name+calories must be provided.',
  })
  @ValidateIf((o) => !o.name || !o.calories)
  @IsOptional()
  @IsInt()
  recipeId?: number;
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

  @ApiPropertyOptional({
    example: 1,
    description: 'Recipe ID if tracking was created from a recipe',
  })
  recipeId?: number | null;

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

export class DayTrackingDto {
  @ApiProperty({ example: 1500, description: 'Total calories for the day' })
  totalCalories: number;

  @ApiProperty({
    example: [
      {
        id: 1,
        name: 'Breakfast',
        calories: 500,
        recipeId: null,
        created: '2024-01-01T08:00:00.000Z',
      },
      { id: 2, name: 'Lunch', calories: 1000, recipeId: 1, created: '2024-01-01T13:00:00.000Z' },
    ],
    description: 'All tracking records for this day',
    type: [TrackingResponseDto],
  })
  records: TrackingResponseDto[];
}

export class CalendarTrackingResponseDto {
  [key: string]: DayTrackingDto;
}
