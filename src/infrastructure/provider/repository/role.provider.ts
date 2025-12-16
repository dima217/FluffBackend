import { Provider } from '@nestjs/common';
import { RoleRepositoryAdapter } from './role.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const roleRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.ROLE_REPOSITORY,
		useClass: RoleRepositoryAdapter,
	},
];

