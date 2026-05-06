import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { RecipeRating } from '@domain/entities/recipe.rating.entity';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';
import { IRecipeRatingRepository } from '@domain/interface/rating.repository';

@Injectable()
export class RecipeRatingRepositoryAdapter implements IRecipeRatingRepository {
  private repository: Repository<RecipeRating>;

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(RecipeRating);
  }

  async findByUserAndRecipe(userId: number, recipeId: number): Promise<RecipeRating | null> {
    return await this.repository.findOne({
      where: {
        user: { id: userId },
        recipe: { id: recipeId },
      },
      relations: ['user', 'recipe'],
    });
  }

  async create(rating: RecipeRating): Promise<RecipeRating> {
    return await this.repository.save(rating);
  }

  async update(id: number, value: number): Promise<void> {
    await this.repository.update(id, { value });
  }

  async getAverage(recipeId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('rating')
      .select('AVG(rating.value)', 'avg')
      .where('rating.recipe_id = :recipeId', { recipeId })
      .getRawOne<{ avg: string | null }>();

    return result?.avg ? Number(result.avg) : 0;
  }

  async getCount(recipeId: number): Promise<number> {
    return await this.repository.count({
      where: {
        recipe: { id: recipeId },
      },
    });
  }
}
