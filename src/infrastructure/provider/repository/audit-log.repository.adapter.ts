import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditLog, AuditLogAction } from '@domain/entities/audit-log.entity';
import { IAuditLogRepository } from '@domain/interface/audit-log.repository';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class AuditLogRepositoryAdapter implements IAuditLogRepository {
	private repository: Repository<AuditLog>;

	constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private dataSource: DataSource) {
		this.repository = this.dataSource.getRepository(AuditLog);
	}

	async create(auditLog: AuditLog): Promise<AuditLog> {
		const newLog = this.repository.create(auditLog);
		return await this.repository.save(newLog);
	}

	async getAuthActivityByDay(
		dateStart: Date,
		dateEnd: Date,
	): Promise<Array<{ date: string; registrations: number; logins: number }>> {
		const registrationActions = [
			AuditLogAction.SIGN_UP_SUCCESS,
			AuditLogAction.OAUTH_REGISTRATION_SUCCESS,
		];
		const loginActions = [AuditLogAction.SIGN_IN_SUCCESS, AuditLogAction.OAUTH_LOGIN_SUCCESS];

		const rows = await this.repository
			.createQueryBuilder('audit')
			.select('DATE(audit.createdAt)', 'date')
			.addSelect(
				`SUM(CASE WHEN audit.action IN (:...registrationActions) THEN 1 ELSE 0 END)`,
				'registrations',
			)
			.addSelect(
				`SUM(CASE WHEN audit.action IN (:...loginActions) THEN 1 ELSE 0 END)`,
				'logins',
			)
			.where('audit.success = true')
			.andWhere('audit.createdAt >= :dateStart', { dateStart })
			.andWhere('audit.createdAt <= :dateEnd', { dateEnd })
			.setParameters({ registrationActions, loginActions })
			.groupBy('DATE(audit.createdAt)')
			.orderBy('DATE(audit.createdAt)', 'ASC')
			.getRawMany();

		return rows.map((r: any) => ({
			date: String(r.date),
			registrations: Number(r.registrations || 0),
			logins: Number(r.logins || 0),
		}));
	}
}

