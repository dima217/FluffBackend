import { Recipe } from '@domain/entities/recipe.entity';
import {
  CreateRecipeDto,
  CreateRecipeWithMediaIdsDto,
  UpdateRecipeDto,
  PrepareUploadDto,
  PrepareUploadResponseDto,
  PrepareStepResourcesUploadDto,
  PrepareStepResourcesUploadResponseDto,
  ConfirmRecipeUploadDto,
} from '@application/dto/recipe.dto';

export interface IRecipeService {
  create(userId: number | null, createDto: CreateRecipeDto): Promise<Recipe>;
  createWithMediaIds(
    userId: number | null,
    createDto: CreateRecipeWithMediaIdsDto,
  ): Promise<Recipe>;
  confirmUpload(
    recipeId: number,
    confirmDto: ConfirmRecipeUploadDto,
    token: string,
  ): Promise<Recipe>;
  prepareUpload(
    userId: number | null,
    prepareDto: PrepareUploadDto,
    token: string,
  ): Promise<PrepareUploadResponseDto>;
  prepareStepResourcesUpload(
    userId: number | null,
    prepareDto: PrepareStepResourcesUploadDto,
    token: string,
  ): Promise<PrepareStepResourcesUploadResponseDto>;
  markMediaAsUploaded(mediaId: string, token: string): Promise<void>;
  findOne(id: number): Promise<Recipe>;
  findAll(userId?: number | null): Promise<Recipe[]>;
  findByUserId(userId: number): Promise<Recipe[]>;
  findFavoritesByUserId(userId: number): Promise<Recipe[]>;
  update(id: number, userId: number | null, updateDto: UpdateRecipeDto): Promise<Recipe>;
  delete(id: number, userId: number | null): Promise<void>;
}
