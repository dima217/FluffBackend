import { AuditLog, AuditLogAction } from '@domain/entities/audit-log.entity';

export interface IAuditLogRepository {
	create(auditLog: AuditLog): Promise<AuditLog>;
}

