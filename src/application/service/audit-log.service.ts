import { Injectable, Inject } from '@nestjs/common';
import type { IAuditLogRepository } from '@domain/interface/audit-log.repository';
import { AuditLog, AuditLogAction } from '@domain/entities/audit-log.entity';
import type { User } from '@domain/entities/user.entity';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';

export interface CreateAuditLogDto {
	user?: User | null;
	action: AuditLogAction;
	ipAddress?: string;
	userAgent?: string;
	deviceInfo?: string;
	success: boolean;
	errorMessage?: string;
	metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
	constructor(
		@Inject(REPOSITORY_CONSTANTS.AUDIT_LOG_REPOSITORY)
		private readonly auditLogRepository: IAuditLogRepository,
	) { }

	async createLog(dto: CreateAuditLogDto): Promise<void> {
		try {
			await this.auditLogRepository.create({
				user: dto.user || null,
				action: dto.action,
				ipAddress: dto.ipAddress || 'unknown',
				userAgent: dto.userAgent || 'unknown',
				deviceInfo: dto.deviceInfo || 'unknown',
				success: dto.success,
				errorMessage: dto.errorMessage || null,
				metadata: dto.metadata || null,
				createdAt: new Date(),
			} as AuditLog);
		} catch (error) {
			// Log error but don't fail
			console.error('Failed to create audit log:', error);
		}
	}

	async getAuthActivityByDay(dateStart: Date, dateEnd: Date) {
		return await this.auditLogRepository.getAuthActivityByDay(dateStart, dateEnd);
	}
}

