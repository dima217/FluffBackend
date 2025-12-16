import { Injectable, Inject, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { IFavoriteService } from '@application/interface/service/favorite.service';
import type { IFavoriteRepository } from '@domain/interface/favorite.repository';
import type { IUserRepository } from '@domain/interface/user.repository';
import { Favorite } from '@domain/entities/favorite.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { FavoriteProcessManager } from './process/favorite-process.manager';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class FavoriteService implements IFavoriteService {
	private readonly logger = new Logger(FavoriteService.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.FAVORITE_REPOSITORY)
		private readonly favoriteRepository: IFavoriteRepository,
		@Inject(REPOSITORY_CONSTANTS.USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly processManager: FavoriteProcessManager,
	) { }

	async addToFavorites(
		userId: number,
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<Favorite> {
		this.logger.log(
			`Adding favorite: userId=${userId}, entityId=${relatedEntityId}, type=${relatedEntityType}`,
		);

		const existingFavorite = await this.favoriteRepository.findByUserAndEntity(
			userId,
			relatedEntityId,
			relatedEntityType,
		);

		if (existingFavorite) {
			throw new ConflictException('Item is already in favorites');
		}

		const user = await this.userRepository.findOne(userId);
		const favorite = {
			user,
			relatedEntityId,
			relatedEntityType,
		} as Favorite;

		const createdFavorite = await this.favoriteRepository.create(favorite);

		await this.processManager.executeOnCreate(createdFavorite);

		this.logger.log(`Favorite added successfully: ID=${createdFavorite.id}`);
		return createdFavorite;
	}

	async removeFromFavorites(
		userId: number,
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<void> {
		this.logger.log(
			`Removing favorite: userId=${userId}, entityId=${relatedEntityId}, type=${relatedEntityType}`,
		);

		const favorite = await this.favoriteRepository.findByUserAndEntity(
			userId,
			relatedEntityId,
			relatedEntityType,
		);

		if (!favorite) {
			throw new NotFoundException('Favorite not found');
		}

		await this.favoriteRepository.deleteByUserAndEntity(userId, relatedEntityId, relatedEntityType);

		await this.processManager.executeOnDelete(favorite);

		this.logger.log(`Favorite removed successfully`);
	}

	async getUserFavorites(userId: number): Promise<Favorite[]> {
		this.logger.log(`Getting favorites for user ID: ${userId}`);
		return await this.favoriteRepository.findByUserId(userId);
	}

	async isFavorite(
		userId: number,
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<boolean> {
		const favorite = await this.favoriteRepository.findByUserAndEntity(
			userId,
			relatedEntityId,
			relatedEntityType,
		);
		return favorite !== null;
	}
}

