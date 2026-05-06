import { RecipeRating } from '@domain/entities/recipe.rating.entity';

export interface IRecipeRatingRepository {
  findByUserAndRecipe(userId: number, recipeId: number): Promise<RecipeRating | null>;
  create(rating: RecipeRating): Promise<RecipeRating>;
  update(id: number, value: number): Promise<void>;

  getAverage(recipeId: number): Promise<number>;
  getCount(recipeId: number): Promise<number>;
}
