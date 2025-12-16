import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
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
} from '@nestjs/swagger';
import { FavoriteService } from '@application/service/favorite.service';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import { RelatedEntityTypeParam } from '@infrastructure/decorator/related-entity-type.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) { }

	@Post(':type/:id')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Add to favorites',
		description: 'Add a recipe or product to favorites',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiParam({ name: 'type', enum: RelatedEntityType, description: 'Entity type (recipe or product)' })
	@ApiParam({ name: 'id', type: Number, description: 'Entity ID' })
	@ApiResponse({ status: 201, description: 'Added to favorites successfully' })
	@ApiResponse({ status: 400, description: 'Bad request - invalid type' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 409, description: 'Already in favorites' })
	async addToFavorites(
		@UserDecorator() user: UserEntity,
		@RelatedEntityTypeParam() type: RelatedEntityType,
		@Param('id', ParseIntPipe) id: number,
	): Promise<{ message: string }> {
		await this.favoriteService.addToFavorites(user.id, id, type);
		return { message: 'Added to favorites successfully' };
	}

	@Delete(':type/:id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Remove from favorites',
		description: 'Remove a recipe or product from favorites',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiParam({ name: 'type', enum: RelatedEntityType, description: 'Entity type (recipe or product)' })
	@ApiParam({ name: 'id', type: Number, description: 'Entity ID' })
	@ApiResponse({ status: 204, description: 'Removed from favorites successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Favorite not found' })
	async removeFromFavorites(
		@UserDecorator() user: UserEntity,
		@RelatedEntityTypeParam() type: RelatedEntityType,
		@Param('id', ParseIntPipe) id: number,
	): Promise<void> {
		await this.favoriteService.removeFromFavorites(user.id, id, type);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Get user favorites',
		description: 'Retrieve all favorites for current user',
	})
	@ApiBearerAuth('JWT-auth')
	@ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async getUserFavorites(@UserDecorator() user: UserEntity) {
		const favorites = await this.favoriteService.getUserFavorites(user.id);
		return favorites;
	}
}

