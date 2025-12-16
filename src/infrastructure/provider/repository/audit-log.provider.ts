import { Provider } from '@nestjs/common';
import { AuditLogRepositoryAdapter } from './audit-log.repository.adapter';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export const auditLogRepository: Provider[] = [
	{
		provide: REPOSITORY_CONSTANTS.AUDIT_LOG_REPOSITORY,
		useClass: AuditLogRepositoryAdapter,
	},
];

