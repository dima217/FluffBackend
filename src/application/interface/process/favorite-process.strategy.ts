import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { Favorite } from '@domain/entities/favorite.entity';

export interface IFavoriteProcessStrategy {
	readonly type: RelatedEntityType;
	executeOnCreate(favorite: Favorite): Promise<void>;
	executeOnDelete(favorite: Favorite): Promise<void>;
}

