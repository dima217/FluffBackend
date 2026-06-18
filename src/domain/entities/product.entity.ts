import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, Min } from 'class-validator';

export interface ProductImage {
	cover: string;
	preview: string;
}

export interface ProductImageMediaIds {
	coverMediaId: string;
	previewMediaId: string;
}

@Entity()
@Index(['name'])
export class Product {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	@IsNotEmpty()
	name: string;

	@Column('decimal', { precision: 10, scale: 2 })
	@Min(0.01)
	calories: number;

	@Column('decimal', { precision: 10, scale: 2 })
	@Min(0.01)
	massa: number;

	@Column('jsonb', { nullable: true })
	image: ProductImage | null;

	@Column('jsonb', { nullable: true })
	imageMediaIds: ProductImageMediaIds | null;

	@Column('int', { default: 0 })
	@Min(0)
	countFavorites: number;

	@Column('boolean', { default: false })
	isFluff: boolean;

	@Column('text', { nullable: true })
	description: string | null;

	@Column('decimal', { precision: 6, scale: 2, nullable: true })
	proteins: number | null;

	@Column('decimal', { precision: 6, scale: 2, nullable: true })
	fats: number | null;

	@Column('decimal', { precision: 6, scale: 2, nullable: true })
	carbs: number | null;

	@CreateDateColumn()
	createdAt: Date;
}

