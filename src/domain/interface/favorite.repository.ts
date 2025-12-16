import { Favorite } from '@domain/entities/favorite.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

export interface IFavoriteRepository {
	create(favorite: Favorite): Promise<Favorite>;
	findOne(id: number): Promise<Favorite>;
	findByUserAndEntity(userId: number, relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<Favorite | null>;
	findByUserId(userId: number): Promise<Favorite[]>;
	findByEntity(relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<Favorite[]>;
	delete(id: number): Promise<void>;
	deleteByUserAndEntity(userId: number, relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<void>;
}

