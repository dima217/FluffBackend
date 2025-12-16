import { Provider } from '@nestjs/common';
import { ProductRepositoryAdapter } from './product.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const productRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.PRODUCT_REPOSITORY,
		useClass: ProductRepositoryAdapter,
	},
];

