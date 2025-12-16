import { Recipe } from '@domain/entities/recipe.entity';
import { CreateRecipeDto, UpdateRecipeDto } from '@application/dto/recipe.dto';

export interface IRecipeService {
	create(userId: number | null, createDto: CreateRecipeDto): Promise<Recipe>;
	findOne(id: number): Promise<Recipe>;
	findAll(userId?: number | null): Promise<Recipe[]>;
	findByUserId(userId: number): Promise<Recipe[]>;
	findFavoritesByUserId(userId: number): Promise<Recipe[]>;
	update(id: number, userId: number | null, updateDto: UpdateRecipeDto): Promise<Recipe>;
	delete(id: number, userId: number | null): Promise<void>;
}

