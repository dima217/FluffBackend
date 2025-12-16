import { Favorite } from '@domain/entities/favorite.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

export interface IFavoriteService {
	addToFavorites(userId: number, relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<Favorite>;
	removeFromFavorites(userId: number, relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<void>;
	getUserFavorites(userId: number): Promise<Favorite[]>;
	isFavorite(userId: number, relatedEntityId: number, relatedEntityType: RelatedEntityType): Promise<boolean>;
}

