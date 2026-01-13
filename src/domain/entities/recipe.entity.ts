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

export interface RecipeImageMediaIds {
  coverMediaId: string;
  previewMediaId: string;
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
  average: number;

  @Column('int', { default: 0 })
  countFavorites: number;

  @Column('jsonb', { nullable: false })
  image: RecipeImage;

  @Column('jsonb', { nullable: true })
  imageMediaIds: RecipeImageMediaIds | null;

  @Column('varchar', { nullable: true })
  promotionalVideo: string | null;

  @Column('varchar', { nullable: true })
  promotionalVideoMediaId: string | null;

  @Column('text', { nullable: true })
  description: string | null;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'recipe_products',
    joinColumn: { name: 'recipe_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @Column('jsonb', { nullable: true })
  customProducts: string[] | null;

  @Column('timestamp', { nullable: true })
  fluffAt: Date | null;

  @Column('decimal', { precision: 10, scale: 2 })
  calories: number;

  @Column('int')
  cookAt: number;

  @Column('jsonb', { nullable: false })
  stepsConfig: RecipeStepsConfig;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
