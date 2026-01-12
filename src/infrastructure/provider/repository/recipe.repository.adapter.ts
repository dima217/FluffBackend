import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Recipe } from '@domain/entities/recipe.entity';
import { IRecipeRepository } from '@domain/interface/recipe.repository';
import { NotFoundEntityException } from '@domain/exceptions/entity.exceptions';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class RecipeRepositoryAdapter implements IRecipeRepository {
  private repository: Repository<Recipe>;

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Recipe);
  }

  async create(recipe: Recipe): Promise<Recipe> {
    const newRecipe = this.repository.create(recipe);
    return await this.repository.save(newRecipe);
  }

  async findOne(id: number): Promise<Recipe> {
    const recipe = await this.repository.findOne({
      where: { id },
      relations: ['user', 'type', 'products'],
    });
    if (!recipe) {
      throw new NotFoundEntityException('Recipe');
    }
    return recipe;
  }

  async findAll(options?: { page: number; limit: number }): Promise<{ data: Recipe[]; total: number }> {
    if (!options) {
      // If no pagination options provided, return all recipes (backward compatibility)
      const data = await this.repository.find({
        relations: ['user', 'type', 'products'],
      });
      return { data, total: data.length };
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      relations: ['user', 'type', 'products'],
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findByUserId(userId: number): Promise<Recipe[]> {
    return await this.repository.find({
      where: { user: { id: userId } },
      relations: ['user', 'type', 'products'],
    });
  }

  async findByIds(ids: number[]): Promise<Recipe[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.repository.find({
      where: ids.map((id) => ({ id })),
      relations: ['user', 'type', 'products'],
    });
  }

  async searchByProductsAndName(
    productIds: number[],
    searchTerm?: string,
    useOr: boolean = false,
  ): Promise<Recipe[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.user', 'user')
      .leftJoinAndSelect('recipe.type', 'type')
      .leftJoinAndSelect('recipe.products', 'products');

    const hasProducts = productIds.length > 0;
    const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;

    if (!hasProducts && !hasSearchTerm) {
      return [];
    }

    if (useOr) {
      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (hasProducts) {
        conditions.push(
          `EXISTS (SELECT 1 FROM recipe_products rp WHERE rp.recipe_id = recipe.id AND rp.product_id IN (:...productIds))`,
        );
        params.productIds = productIds;
      }

      if (hasSearchTerm) {
        params.searchTerm = `%${searchTerm.trim()}%`;
        conditions.push('LOWER(recipe.name) LIKE LOWER(:searchTerm)');
      }

      if (conditions.length > 0) {
        queryBuilder.where(`(${conditions.join(' OR ')})`, params);
      }
    } else {
      if (hasProducts) {
        queryBuilder.innerJoin(
          'recipe.products',
          'searchProduct',
          'searchProduct.id IN (:...productIds)',
          {
            productIds,
          },
        );
      }

      if (hasSearchTerm) {
        queryBuilder.andWhere('LOWER(recipe.name) LIKE LOWER(:searchTerm)', {
          searchTerm: `%${searchTerm.trim()}%`,
        });
      }
    }

    return await queryBuilder.getMany();
  }

  async update(id: number, recipe: Partial<Recipe>): Promise<Recipe> {
    const existingRecipe = await this.findOne(id);
    Object.assign(existingRecipe, recipe);
    return await this.repository.save(existingRecipe);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
