import { Provider } from '@nestjs/common';
import { TokenRepositoryAdapter } from './token.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const tokenRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.TOKEN_REPOSITORY,
		useClass: TokenRepositoryAdapter,
	},
];

