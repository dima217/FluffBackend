import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index } from "typeorm";
import { User } from "./user.entity";



@Entity()
@Index(['token'])
@Index(['user'])
@Index(['expiresAt'])
export class Token {
	@PrimaryGeneratedColumn('uuid')
	id: string;	

	@Column()
	token: string;

	@ManyToOne(() => User, (user) => user.id)
	@JoinColumn({ name: "user_id" })
	user: User;

	@Column()
	expiresAt: Date;

	@Column()
	createdAt: Date;
}