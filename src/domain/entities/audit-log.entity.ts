import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	JoinColumn,
	PrimaryGeneratedColumn,
	Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditLogAction {
	SIGN_UP_INIT = 'sign_up_init',
	SIGN_UP_SUCCESS = 'sign_up_success',
	SIGN_UP_FAILED = 'sign_up_failed',
	SIGN_IN_SUCCESS = 'sign_in_success',
	SIGN_IN_FAILED = 'sign_in_failed',
	SIGN_OUT = 'sign_out',
	RECOVERY_INIT = 'recovery_init',
	RECOVERY_CONFIRM_SUCCESS = 'recovery_confirm_success',
	RECOVERY_CONFIRM_FAILED = 'recovery_confirm_failed',
	NEW_ACCESS_TOKEN = 'new_access_token',
	OAUTH_LOGIN_SUCCESS = 'oauth_login_success',
	OAUTH_LOGIN_FAILED = 'oauth_login_failed',
	OAUTH_REGISTRATION_SUCCESS = 'oauth_registration_success',
	OAUTH_REGISTRATION_FAILED = 'oauth_registration_failed',
}

@Entity()
@Index(['user'])
@Index(['action'])
@Index(['createdAt'])
@Index(['user', 'createdAt'])
export class AuditLog {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@Column({
		type: 'varchar',
		enum: AuditLogAction,
	})
	action: AuditLogAction;

	@Column({ nullable: true })
	ipAddress: string;

	@Column({ nullable: true })
	userAgent: string;

	@Column({ nullable: true })
	deviceInfo: string;

	@Column({ default: true })
	success: boolean;

	@Column({ type: 'text', nullable: true })
	errorMessage: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, any>;

	@CreateDateColumn()
	createdAt: Date;
}

