import { Product } from '@domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '@application/dto/product.dto';

export interface IProductService {
	create(createDto: CreateProductDto): Promise<Product>;
	findOne(id: number, userId?: number | null): Promise<Product>;
	findAll(userId?: number | null): Promise<Product[]>;
	findFavoritesByUserId(userId: number): Promise<Product[]>;
	update(id: number, updateDto: UpdateProductDto): Promise<Product>;
	delete(id: number): Promise<void>;
}

