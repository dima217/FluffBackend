import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { IsEnum, IsNotEmpty } from 'class-validator';

@Entity()
export class Role {
	static Roles = {
		ADMIN: 'admin',
		USER: 'user',
	} as const;

	@PrimaryGeneratedColumn()
	id: number;

	@IsEnum(Role.Roles)
	@IsNotEmpty()
	@Column({ unique: true, type: 'varchar' })
	name: RoleName;

	@Column({ nullable: true })
	description: string;

	@ManyToMany(() => User, (user) => user.roles)
	users: User[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

export type RoleName = typeof Role.Roles[keyof typeof Role.Roles];