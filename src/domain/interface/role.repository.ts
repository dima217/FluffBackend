import { Role } from '@domain/entities/role.entity';

export interface IRoleRepository {
	create(role: Role): Promise<Role>;
	findById(id: number): Promise<Role | null>;
	findByName(name: string): Promise<Role | null>;
	findAll(): Promise<Role[]>;
}

