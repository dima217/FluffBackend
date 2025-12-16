import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, Min, Max, IsEnum } from 'class-validator';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';
import { User } from './user.entity';

@Entity()
@Index(['relatedEntityId', 'relatedEntityType'])
export class Review {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	@IsNotEmpty()
	relatedEntityId: string;

	@Column({ type: 'varchar' })
	@IsNotEmpty()
	@IsEnum(RelatedEntityType)
	relatedEntityType: RelatedEntityType;

	@Column({ type: 'text' })
	message: string;

	@Column('decimal', { precision: 3, scale: 2 })
	@Min(0)
	@Max(5)
	score: number;

	@ManyToOne(() => User, { nullable: false })
	@JoinColumn({ name: 'user_id' })
	@IsNotEmpty()
	user: User;

	@CreateDateColumn()
	created: Date;
}

