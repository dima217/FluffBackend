import { AuditLog, AuditLogAction } from '@domain/entities/audit-log.entity';

export interface IAuditLogRepository {
	create(auditLog: AuditLog): Promise<AuditLog>;
	getAuthActivityByDay(
		dateStart: Date,
		dateEnd: Date,
	): Promise<Array<{ date: string; registrations: number; logins: number }>>;
}

