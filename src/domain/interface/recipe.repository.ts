import { Recipe } from '@domain/entities/recipe.entity';

export interface IRecipeRepository {
	create(recipe: Recipe): Promise<Recipe>;
	findOne(id: number): Promise<Recipe>;
	findAll(): Promise<Recipe[]>;
	findByUserId(userId: number): Promise<Recipe[]>;
	findByIds(ids: number[]): Promise<Recipe[]>;
	update(id: number, recipe: Partial<Recipe>): Promise<Recipe>;
	delete(id: number): Promise<void>;
}

