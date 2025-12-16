import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, Min } from 'class-validator';

@Entity()
@Index(['name'])
@Index(['calories'])
export class Tracking {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	@IsNotEmpty()
	name: string;

	@Column('decimal', { precision: 10, scale: 2 })
	@Min(0.01)
	calories: number;

	@CreateDateColumn()
	created: Date;
}

