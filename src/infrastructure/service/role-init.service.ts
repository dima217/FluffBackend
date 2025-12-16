import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { IRoleRepository } from '@domain/interface/role.repository';
import { Role } from '@domain/entities/role.entity';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class RoleInitService implements OnModuleInit {
	private readonly logger = new Logger(RoleInitService.name);

	constructor(
		@Inject(REPOSITORY_CONSTANTS.ROLE_REPOSITORY)
		private readonly roleRepository: IRoleRepository,
	) { }

	async onModuleInit() {
		await this.initializeRoles();
	}

	private async initializeRoles(): Promise<void> {
		try {
			const adminRole = await this.roleRepository.findByName(Role.Roles.ADMIN);
			if (!adminRole) {
				await this.roleRepository.create({
					id: 0,
					name: Role.Roles.ADMIN,
					description: 'Administrator role with full access',
					users: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				} as Role);
				this.logger.log('Admin role created successfully');
			} else {
				this.logger.debug('Admin role already exists');
			}
		} catch (error) {
			this.logger.error(`Failed to initialize roles: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

