import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { User } from './user.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

@Entity()
@Index(['user', 'relatedEntityId', 'relatedEntityType'], { unique: true })
@Index(['relatedEntityId', 'relatedEntityType'])
export class Favorite {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { nullable: false })
	@JoinColumn({ name: 'user_id' })
	@IsNotEmpty()
	user: User;

	@Column()
	@IsNotEmpty()
	relatedEntityId: number;

	@Column({ type: 'varchar' })
	@IsNotEmpty()
	@IsEnum(RelatedEntityType)
	relatedEntityType: RelatedEntityType;

	@CreateDateColumn()
	createdAt: Date;
}

