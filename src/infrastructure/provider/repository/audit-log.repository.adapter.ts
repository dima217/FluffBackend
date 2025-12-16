import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '@domain/entities/audit-log.entity';
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
}

