import { Provider } from '@nestjs/common';
import { CodeRepositoryAdapter } from './code.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const codeRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.CODE_REPOSITORY,
		useClass: CodeRepositoryAdapter,
	},
];

