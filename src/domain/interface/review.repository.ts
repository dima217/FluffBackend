import { Review } from '@domain/entities/review.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

export interface IReviewRepository {
	create(review: Review): Promise<Review>;
	findOne(id: number): Promise<Review>;
	findByEntity(relatedEntityId: string, relatedEntityType: RelatedEntityType): Promise<Review[]>;
	findByUserId(userId: number): Promise<Review[]>;
	findAll(): Promise<Review[]>;
	update(id: number, review: Partial<Review>): Promise<Review>;
	delete(id: number): Promise<void>;
}

