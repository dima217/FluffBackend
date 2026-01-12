import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNotEmpty, Min } from 'class-validator';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';

@Entity()
@Index(['name'])
@Index(['calories'])
@Index(['user'])
export class Tracking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @Min(0.01)
  calories: number;

  @ManyToOne(() => Recipe, { nullable: true })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe | null;

  @CreateDateColumn()
  created: Date;
}
