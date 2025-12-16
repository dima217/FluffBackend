import { Tracking } from '@domain/entities/tracking.entity';
import { CreateTrackingDto, TrackingResponseDto } from '@application/dto/tracking.dto';

export class TrackingMapper {
	static toEntity(createDto: CreateTrackingDto): Tracking {
		return {
			name: createDto.name,
			calories: createDto.calories,
		} as Tracking;
	}

	static toResponseDto(tracking: Tracking): TrackingResponseDto {
		return {
			id: tracking.id,
			name: tracking.name,
			calories: Number(tracking.calories),
			created: tracking.created,
		};
	}
}

