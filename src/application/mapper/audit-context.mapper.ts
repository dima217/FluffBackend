import type { Request } from 'express';
import { AuditContext } from '@application/dto/audit-context.dto';
import { RequestUtils } from '@infrastructure/utils/request.util';

export class AuditContextMapper {
	static fromRequest(request: Request): AuditContext {
		return new AuditContext(
			RequestUtils.getIpAddress(request),
			RequestUtils.getUserAgent(request),
			RequestUtils.getDeviceInfo(request),
		);
	}
}

