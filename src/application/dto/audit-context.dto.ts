export class AuditContext {
	ipAddress?: string;
	userAgent?: string;
	deviceInfo?: string;

	constructor(ipAddress?: string, userAgent?: string, deviceInfo?: string) {
		this.ipAddress = ipAddress;
		this.userAgent = userAgent;
		this.deviceInfo = deviceInfo;
	}
}

