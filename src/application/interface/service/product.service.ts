import { Product } from '@domain/entities/product.entity';
import {
  CreateProductDto,
  CreateProductWithMediaIdsDto,
  UpdateProductDto,
  ConfirmProductUploadDto,
  PrepareProductUploadDto,
  PrepareProductUploadResponseDto,
} from '@application/dto/product.dto';

export interface IProductService {
  create(createDto: CreateProductDto): Promise<Product>;
  createWithMediaIds(createDto: CreateProductWithMediaIdsDto): Promise<Product>;
  confirmUpload(
    productId: number,
    confirmDto: ConfirmProductUploadDto,
    token: string,
  ): Promise<Product>;
  prepareUpload(
    userId: number | null,
    prepareDto: PrepareProductUploadDto,
    token: string,
  ): Promise<PrepareProductUploadResponseDto>;
  markMediaAsUploaded(mediaId: string, token: string): Promise<void>;
  findOne(id: number, userId?: number | null): Promise<Product>;
  findAll(userId?: number | null, page?: number, limit?: number): Promise<{ data: Product[]; total: number }>;
  findByIds(ids: number[], userId?: number | null): Promise<Product[]>;
  findFavoritesByUserId(userId: number): Promise<Product[]>;
  search(searchQuery: string, userId?: number | null): Promise<Product[]>;
  update(id: number, updateDto: UpdateProductDto): Promise<Product>;
  delete(id: number): Promise<void>;
}
