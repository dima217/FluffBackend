import { Tracking } from '@domain/entities/tracking.entity';
import { CreateTrackingDto, TrackingResponseDto } from '@application/dto/tracking.dto';
import type { User } from '@domain/entities/user.entity';
import type { Recipe } from '@domain/entities/recipe.entity';

export class TrackingMapper {
	static toEntity(
		createDto: CreateTrackingDto,
		user: User,
		recipe: Recipe | null = null,
	): Tracking {
		return {
			user,
			name: createDto.name || (recipe ? recipe.name : ''),
			calories: createDto.calories || (recipe ? recipe.calories : 0),
			recipe: recipe,
		} as Tracking;
	}

	static toResponseDto(tracking: Tracking): TrackingResponseDto {
		return {
			id: tracking.id,
			name: tracking.name,
			calories: Number(tracking.calories),
			recipeId: tracking.recipe?.id || null,
			created: tracking.created,
		};
	}
}

