import { RecipeType } from '@domain/entities/recipe-type.entity';

export interface IRecipeTypeRepository {
	create(recipeType: RecipeType): Promise<RecipeType>;
	findOne(id: number): Promise<RecipeType>;
	findByName(name: string): Promise<RecipeType | null>;
	findAll(): Promise<RecipeType[]>;
	update(id: number, recipeType: Partial<RecipeType>): Promise<RecipeType>;
	delete(id: number): Promise<void>;
}

