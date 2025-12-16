import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RecipeType } from '@domain/entities/recipe-type.entity';
import { IRecipeTypeRepository } from '@domain/interface/recipe-type.repository';
import {
	NotFoundEntityException,
	AlreadyExistEntityException,
} from '@domain/exceptions/entity.exceptions';
import { isUniqueError } from '@domain/utils/error.utils';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class RecipeTypeRepositoryAdapter implements IRecipeTypeRepository {
	private repository: Repository<RecipeType>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(RecipeType);
	}

	async create(recipeType: RecipeType): Promise<RecipeType> {
		try {
			const newRecipeType = this.repository.create(recipeType);
			return await this.repository.save(newRecipeType);
		} catch (error) {
			if (isUniqueError(error)) {
				throw new AlreadyExistEntityException('RecipeType');
			}
			throw error;
		}
	}

	async findOne(id: number): Promise<RecipeType> {
		const recipeType = await this.repository.findOne({ where: { id } });
		if (!recipeType) {
			throw new NotFoundEntityException('RecipeType');
		}
		return recipeType;
	}

	async findByName(name: string): Promise<RecipeType | null> {
		return await this.repository.findOne({ where: { name } });
	}

	async findAll(): Promise<RecipeType[]> {
		return await this.repository.find();
	}

	async update(id: number, recipeType: Partial<RecipeType>): Promise<RecipeType> {
		try {
			const existingRecipeType = await this.findOne(id);
			Object.assign(existingRecipeType, recipeType);
			return await this.repository.save(existingRecipeType);
		} catch (error) {
			if (isUniqueError(error)) {
				throw new AlreadyExistEntityException('RecipeType');
			}
			throw error;
		}
	}

	async delete(id: number): Promise<void> {
		await this.findOne(id);
		await this.repository.delete(id);
	}
}

