import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Review } from '@domain/entities/review.entity';
import { IReviewRepository } from '@domain/interface/review.repository';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ReviewRepositoryAdapter implements IReviewRepository {
	private repository: Repository<Review>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Review);
	}

	async create(review: Review): Promise<Review> {
		const newReview = this.repository.create(review);
		return await this.repository.save(newReview);
	}

	async findOne(id: number): Promise<Review> {
		const review = await this.repository.findOne({
			where: { id },
			relations: ['user'],
		});
		if (!review) {
			throw new NotFoundEntityException('Review');
		}
		return review;
	}

	async findByEntity(
		relatedEntityId: string,
		relatedEntityType: RelatedEntityType,
	): Promise<Review[]> {
		return await this.repository.find({
			where: { relatedEntityId, relatedEntityType },
			relations: ['user'],
			order: { created: 'DESC' },
		});
	}

	async findByUserId(userId: number): Promise<Review[]> {
		return await this.repository.find({
			where: { user: { id: userId } },
			relations: ['user'],
			order: { created: 'DESC' },
		});
	}

	async findAll(): Promise<Review[]> {
		return await this.repository.find({
			relations: ['user'],
			order: { created: 'DESC' },
		});
	}

	async update(id: number, review: Partial<Review>): Promise<Review> {
		const existingReview = await this.findOne(id);
		Object.assign(existingReview, review);
		return await this.repository.save(existingReview);
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.repository.delete(id);
	}
}

