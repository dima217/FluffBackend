import { AuditLogAction } from '@domain/entities/audit-log.entity';
import { AuditContext } from '@application/dto/audit-context.dto';
import type { User } from '@domain/entities/user.entity';
import type { CreateAuditLogDto } from '@application/service/audit-log.service';

export class AuditLogMapper {
	static toCreateDto(
		action: AuditLogAction,
		context: AuditContext,
		options: {
			user?: User | null;
			success: boolean;
			errorMessage?: string;
			metadata?: Record<string, any>;
		},
	): CreateAuditLogDto {
		return {
			user: options.user || null,
			action,
			ipAddress: context.ipAddress,
			userAgent: context.userAgent,
			deviceInfo: context.deviceInfo,
			success: options.success,
			errorMessage: options.errorMessage,
			metadata: options.metadata,
		};
	}
}

