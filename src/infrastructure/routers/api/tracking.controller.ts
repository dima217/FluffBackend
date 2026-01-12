import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TrackingService } from '@application/service/tracking.service';
import {
  CreateTrackingDto,
  UpdateTrackingDto,
  TrackingResponseDto,
  DayStatisticsDto,
  DayStatisticsResponseDto,
  CalendarTrackingResponseDto,
} from '@application/dto/tracking.dto';
import { TrackingMapper } from '@application/mapper/tracking.mapper';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new tracking record',
    description:
      'Create a new tracking record. You can either:\n\n' +
      '**Option 1: Custom tracking** - Provide name and calories manually (e.g., "хуй моржовый 100000кг" with any calories)\n' +
      '**Option 2: Recipe tracking** - Provide recipeId to automatically use recipe name and calories\n\n' +
      '**Note:** Either recipeId OR both name and calories must be provided.',
  })
  @ApiBody({ type: CreateTrackingDto })
  @ApiResponse({
    status: 201,
    description: 'Tracking created successfully',
    type: TrackingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or missing required fields',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipe not found (if recipeId provided)' })
  async create(
    @UserDecorator() user: UserEntity,
    @Body() createDto: CreateTrackingDto,
  ): Promise<TrackingResponseDto> {
    const tracking = await this.trackingService.create(user.id, createDto);
    return TrackingMapper.toResponseDto(tracking);
  }

  @Get('calendar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current month calendar',
    description:
      'Get tracking records grouped by day for the current month (from 1st to last day of the month). ' +
      'Returns a JSON object where each key is a date (YYYY-MM-DD) and value contains total calories and all records for that day. ' +
      'Only days with tracking records are included.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar data retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          totalCalories: { type: 'number', example: 1500 },
          records: {
            type: 'array',
            items: { $ref: '#/components/schemas/TrackingResponseDto' },
          },
        },
      },
      example: {
        '2024-01-01': {
          totalCalories: 1500,
          records: [
            {
              id: 1,
              name: 'Breakfast',
              calories: 500,
              recipeId: null,
              created: '2024-01-01T08:00:00.000Z',
            },
            {
              id: 2,
              name: 'Lunch',
              calories: 1000,
              recipeId: 1,
              created: '2024-01-01T13:00:00.000Z',
            },
          ],
        },
        '2024-01-02': {
          totalCalories: 2000,
          records: [
            {
              id: 3,
              name: 'Dinner',
              calories: 2000,
              recipeId: null,
              created: '2024-01-02T19:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentMonthCalendar(
    @UserDecorator() user: UserEntity,
  ): Promise<CalendarTrackingResponseDto> {
    return await this.trackingService.getCurrentMonthCalendar(user.id);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all tracking records',
    description: 'Retrieve all tracking records for the current user (all time)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tracking records retrieved successfully',
    type: [TrackingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@UserDecorator() user: UserEntity): Promise<TrackingResponseDto[]> {
    const trackings = await this.trackingService.findAll(user.id);
    return trackings.map((tracking) => TrackingMapper.toResponseDto(tracking));
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get day statistics',
    description: 'Get aggregated statistics for calories in a date range for the current user',
  })
  @ApiQuery({ name: 'dateStart', type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnd', type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: DayStatisticsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDayStatistics(
    @UserDecorator() user: UserEntity,
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ): Promise<DayStatisticsResponseDto> {
    return await this.trackingService.getDayStatistics(user.id, dateStart, dateEnd);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get tracking by ID',
    description: 'Retrieve a specific tracking record by its ID (only for current user)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
  @ApiResponse({
    status: 200,
    description: 'Tracking retrieved successfully',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @UserDecorator() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TrackingResponseDto> {
    const tracking = await this.trackingService.findOne(id, user.id);
    return TrackingMapper.toResponseDto(tracking);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update tracking',
    description: 'Update an existing tracking record (only for current user)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
  @ApiBody({ type: UpdateTrackingDto })
  @ApiResponse({
    status: 200,
    description: 'Tracking updated successfully',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  async update(
    @UserDecorator() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTrackingDto,
  ): Promise<TrackingResponseDto> {
    const tracking = await this.trackingService.update(id, user.id, updateDto);
    return TrackingMapper.toResponseDto(tracking);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete tracking',
    description: 'Delete a tracking record (only for current user)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
  @ApiResponse({ status: 204, description: 'Tracking deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  async delete(
    @UserDecorator() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.trackingService.delete(id, user.id);
  }
}
