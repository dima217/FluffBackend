import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  birthDate: Date;

  @Column()
  bio: string;

  @Column()
  photo: string;

  @Column({ nullable: true })
  gender: string | null;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  height: number | null;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight: number | null;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
