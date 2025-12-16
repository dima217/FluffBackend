import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role, RoleName } from '@domain/entities/role.entity';
import { IRoleRepository } from '@domain/interface/role.repository';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class RoleRepositoryAdapter implements IRoleRepository {
	private repository: Repository<Role>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(Role);
	}

	async create(role: Role): Promise<Role> {
		const newRole = this.repository.create(role);
		return await this.repository.save(newRole);
	}

	async findById(id: number): Promise<Role | null> {
		return await this.repository.findOne({ where: { id } });
	}

	async findByName(name: RoleName): Promise<Role | null> {
		return await this.repository.findOne({ where: { name: name } });
	}

	async findAll(): Promise<Role[]> {
		return await this.repository.find();
	}
}

