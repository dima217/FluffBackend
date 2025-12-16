import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { UAParser } from 'ua-parser-js';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
	constructor(@Inject(PROVIDER_CONSTANTS.PINO_LOGGER) private readonly logger: Logger) { }


	private logRequest(request: Request, url: string, timestamp: string, statusCode: number) {
		console.debug(`[${timestamp}] ${request.method} ${url} - ${statusCode}`);
		console.debug(`[${timestamp}] ${request.method} ${url} - ${statusCode}`);
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();

		const url = request.originalUrl || request.url;
		const timestamp = new Date().toISOString();

		console.debug(`[${timestamp}] ${request.method} ${url}`);

		// Skip logging for health check and Swagger documentation
		if (url.includes('/health') || url.startsWith('/api/docs') || url.startsWith('/api-json')) {
			return next.handle();
		}

		const startTime = Date.now();
		const method = request.method;
		const ip = this.getClientIp(request);
		const userAgent = request.get('user-agent') || 'unknown';
		const user = (request as any).user;
		const userId = user?.id || null;

		// Parse user agent to get OS and browser info
		const parser = new UAParser(userAgent);
		const os = parser.getOS();
		const browser = parser.getBrowser();
		const device = parser.getDevice();

		const osInfo = os.name && os.version ? `${os.name} ${os.version}` : os.name || 'Unknown';
		const browserInfo = browser.name && browser.version
			? `${browser.name} ${browser.version}`
			: browser.name || 'Unknown';
		const deviceInfo = device.model && device.vendor
			? `${device.vendor} ${device.model}`
			: device.model || device.vendor || 'Unknown';

		return next.handle().pipe(
			tap({
				next: () => {
					const duration = Date.now() - startTime;
					const statusCode = response.statusCode;

					const success = statusCode >= 200 && statusCode < 400;

					const logData = {
						type: 'http-request',
						method,
						url,
						statusCode,
						success,
						duration,
						userId,
						ip,
						userAgent,
						os: osInfo,
						browser: browserInfo,
						device: deviceInfo,
						timestamp: new Date().toISOString(),
					};

					if (success) {
						this.logger.debug(logData, `HTTP ${method} ${url} - ${statusCode}`);
					} else {
						this.logger.warn(logData, `HTTP ${method} ${url} - ${statusCode}`);
					}
				},
				error: (error) => {
					const duration = Date.now() - startTime;
					const statusCode = error.status || response.statusCode || 500;

					const logData = {
						type: 'http-request',
						method,
						url,
						statusCode,
						success: false,
						duration,
						userId,
						ip,
						userAgent,
						os: osInfo,
						browser: browserInfo,
						device: deviceInfo,
						error: error.message || 'Unknown error',
						timestamp: new Date().toISOString(),
					};

					this.logger.error(logData, `HTTP ${method} ${url} - ${statusCode} - Error`);
				},
			}),
		);
	}

	private getClientIp(request: Request): string {
		const forwarded = request.headers['x-forwarded-for'];
		if (typeof forwarded === 'string') {
			return forwarded.split(',')[0].trim();
		}
		if (Array.isArray(forwarded) && forwarded.length > 0) {
			return forwarded[0].split(',')[0].trim();
		}

		const realIp = request.headers['x-real-ip'];
		const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;

		return (
			request.ip ||
			request.socket.remoteAddress ||
			realIpStr ||
			'unknown'
		);
	}
}

