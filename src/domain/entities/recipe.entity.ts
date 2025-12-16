import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, Min, Max } from 'class-validator';
import { User } from './user.entity';
import { Product } from './product.entity';
import { RecipeType } from './recipe-type.entity';

export interface RecipeImage {
	cover: string;
	preview: string;
}

export interface RecipeResource {
	position: number;
	source: string;
	type: string;
}

export interface RecipeStep {
	name: string;
	description: string;
	resources: RecipeResource[];
}

export interface RecipeStepsConfig {
	steps: RecipeStep[];
}

@Entity()
export class Recipe {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@Column()
	@IsNotEmpty()
	name: string;

	@ManyToOne(() => RecipeType, { nullable: false })
	@JoinColumn({ name: 'recipe_type_id' })
	type: RecipeType;

	@Column('decimal', { precision: 5, scale: 2, default: 0 })
	@Min(0)
	@Max(5)
	average: number;

	@Column('int', { default: 0 })
	@Min(0)
	countFavorites: number;

	@Column('jsonb')
	image: RecipeImage;

	@Column({ nullable: true })
	promotionalVideo: string | null;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@ManyToMany(() => Product)
	@JoinTable({
		name: 'recipe_products',
		joinColumn: { name: 'recipe_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
	})
	products: Product[];

	@Column({ type: 'timestamp', nullable: true })
	fluffAt: Date | null;

	@Column('decimal', { precision: 10, scale: 2 })
	@Min(0)
	calories: number;

	@Column('int')
	@Min(0)
	cookAt: number;

	@Column('jsonb')
	stepsConfig: RecipeStepsConfig;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

