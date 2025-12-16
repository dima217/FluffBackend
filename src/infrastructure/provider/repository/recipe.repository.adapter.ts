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

	async findAll(): Promise<Recipe[]> {
		return await this.repository.find({
			relations: ['user', 'type', 'products'],
		});
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

