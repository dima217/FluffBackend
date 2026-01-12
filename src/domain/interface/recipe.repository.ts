import { Recipe } from '@domain/entities/recipe.entity';
import { PaginationOptions, PaginationResult } from './product.repository';

export interface IRecipeRepository {
	create(recipe: Recipe): Promise<Recipe>;
	findOne(id: number): Promise<Recipe>;
	findAll(options?: PaginationOptions): Promise<PaginationResult<Recipe>>;
	findByUserId(userId: number): Promise<Recipe[]>;
	findByIds(ids: number[]): Promise<Recipe[]>;
	searchByProductsAndName(productIds: number[], searchTerm?: string, useOr?: boolean): Promise<Recipe[]>;
	update(id: number, recipe: Partial<Recipe>): Promise<Recipe>;
	delete(id: number): Promise<void>;
}

