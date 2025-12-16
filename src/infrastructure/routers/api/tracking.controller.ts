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
import { CreateTrackingDto, UpdateTrackingDto, TrackingResponseDto, DayStatisticsDto, DayStatisticsResponseDto } from '@application/dto/tracking.dto';
import { TrackingMapper } from '@application/mapper/tracking.mapper';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
	constructor(private readonly trackingService: TrackingService) { }

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Create a new tracking record', description: 'Create a new tracking record' })
	@ApiBody({ type: CreateTrackingDto })
	@ApiResponse({ status: 201, description: 'Tracking created successfully', type: TrackingResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async create(@Body() createDto: CreateTrackingDto): Promise<TrackingResponseDto> {
		const tracking = await this.trackingService.create(createDto);
		return TrackingMapper.toResponseDto(tracking);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get all tracking records', description: 'Retrieve all tracking records' })
	@ApiResponse({ status: 200, description: 'Tracking records retrieved successfully', type: [TrackingResponseDto] })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async findAll(): Promise<TrackingResponseDto[]> {
		const trackings = await this.trackingService.findAll();
		return trackings.map((tracking) => TrackingMapper.toResponseDto(tracking));
	}

	@Get('statistics')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get day statistics', description: 'Get aggregated statistics for calories in a date range' })
	@ApiQuery({ name: 'dateStart', type: String, description: 'Start date (YYYY-MM-DD)' })
	@ApiQuery({ name: 'dateEnd', type: String, description: 'End date (YYYY-MM-DD)' })
	@ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: DayStatisticsResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid date format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async getDayStatistics(
		@Query('dateStart') dateStart: string,
		@Query('dateEnd') dateEnd: string,
	): Promise<DayStatisticsResponseDto> {
		return await this.trackingService.getDayStatistics(dateStart, dateEnd);
	}

	@Get(':id')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get tracking by ID', description: 'Retrieve a specific tracking record by its ID' })
	@ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
	@ApiResponse({ status: 200, description: 'Tracking retrieved successfully', type: TrackingResponseDto })
	@ApiResponse({ status: 404, description: 'Tracking not found' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<TrackingResponseDto> {
		const tracking = await this.trackingService.findOne(id);
		return TrackingMapper.toResponseDto(tracking);
	}

	@Put(':id')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Update tracking', description: 'Update an existing tracking record' })
	@ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
	@ApiBody({ type: UpdateTrackingDto })
	@ApiResponse({ status: 200, description: 'Tracking updated successfully', type: TrackingResponseDto })
	@ApiResponse({ status: 400, description: 'Bad request - invalid data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Tracking not found' })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateDto: UpdateTrackingDto,
	): Promise<TrackingResponseDto> {
		const tracking = await this.trackingService.update(id, updateDto);
		return TrackingMapper.toResponseDto(tracking);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Delete tracking', description: 'Delete a tracking record' })
	@ApiParam({ name: 'id', type: Number, description: 'Tracking ID' })
	@ApiResponse({ status: 204, description: 'Tracking deleted successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Tracking not found' })
	async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.trackingService.delete(id);
	}
}

