import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Favorite } from '@domain/entities/favorite.entity';
import { IFavoriteRepository } from '@domain/interface/favorite.repository';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { NotFoundEntityException, AlreadyExistEntityException } from '@domain/exceptions/entity.exceptions';
import { isUniqueError } from '@domain/utils/error.utils';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class FavoriteRepositoryAdapter implements IFavoriteRepository {
	private repository: Repository<Favorite>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Favorite);
	}

	async create(favorite: Favorite): Promise<Favorite> {
		try {
			const newFavorite = this.repository.create(favorite);
			return await this.repository.save(newFavorite);
		} catch (error) {
			if (isUniqueError(error)) {
				throw new AlreadyExistEntityException('Favorite');
			}
			throw error;
		}
	}

	async findOne(id: number): Promise<Favorite> {
		const favorite = await this.repository.findOne({
			where: { id },
			relations: ['user'],
		});
		if (!favorite) {
			throw new NotFoundEntityException('Favorite');
		}
		return favorite;
	}

	async findByUserAndEntity(
		userId: number,
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<Favorite | null> {
		return await this.repository.findOne({
			where: {
				user: { id: userId },
				relatedEntityId,
				relatedEntityType,
			},
			relations: ['user'],
		});
	}

	async findByUserId(userId: number): Promise<Favorite[]> {
		return await this.repository.find({
			where: { user: { id: userId } },
			relations: ['user'],
			order: { createdAt: 'DESC' },
		});
	}

	async findByEntity(
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<Favorite[]> {
		return await this.repository.find({
			where: { relatedEntityId, relatedEntityType },
			relations: ['user'],
			order: { createdAt: 'DESC' },
		});
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.repository.delete(id);
	}

	async deleteByUserAndEntity(
		userId: number,
		relatedEntityId: number,
		relatedEntityType: RelatedEntityType,
	): Promise<void> {
		await this.repository.delete({
			user: { id: userId },
			relatedEntityId,
			relatedEntityType,
		});
	}
}

