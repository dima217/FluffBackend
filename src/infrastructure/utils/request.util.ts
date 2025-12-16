import type { Request } from 'express';

export class RequestUtils {
	static getIpAddress(request: Request): string {
		return (
			(request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
			(request.headers['x-real-ip'] as string) ||
			request.ip ||
			request.socket.remoteAddress ||
			'unknown'
		);
	}

	static getUserAgent(request: Request): string {
		return request.headers['user-agent'] || 'unknown';
	}

	static getDeviceInfo(request: Request): string {
		const userAgent = this.getUserAgent(request);
		// Простой парсинг user-agent для определения устройства
		if (/mobile|android|iphone|ipad/i.test(userAgent)) {
			return 'mobile';
		}
		if (/tablet|ipad/i.test(userAgent)) {
			return 'tablet';
		}
		return 'desktop';
	}
}

