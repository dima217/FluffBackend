import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';
import type { AppConfig } from '@config';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

export const pinoLoggerProvider: Provider = {
	provide: PROVIDER_CONSTANTS.PINO_LOGGER,
	useFactory: (configService: ConfigService<AppConfig>) => {
		const appConfig = configService.get<AppConfig>('app', { infer: true });
		const nodeEnv = appConfig?.nodeEnv ?? 'development';

		// Loki configuration
		const lokiHost = process.env.LOKI_HOST ?? 'http://loki:3100';
		const lokiLabels = {
			app: 'constructor-auth',
			environment: nodeEnv,
			logType: 'http-request',
		};

		// Create transports array
		const transports: Array<pino.TransportTargetOptions> = [];

		// Add Loki transport for production
		if (nodeEnv === 'production') {
			transports.push({
				target: 'pino-loki',
				level: 'info',
				options: {
					host: lokiHost,
					labels: lokiLabels,
					batching: true,
					interval: 5,
				},
			});
		}

		// Add pretty print for development
		if (nodeEnv === 'development') {
			transports.push({
				target: 'pino-pretty',
				level: 'debug',
				options: {
					colorize: true,
					translateTime: 'SYS:standard',
					ignore: 'pid,hostname',
				},
			});
		}

		// Create Pino logger
		const logger = pino(
			{
				level: nodeEnv === 'production' ? 'debug' : 'debug',
				formatters: {
					level: (label) => {
						return { level: label };
					},
				},
			},
			transports.length > 0
				? pino.transport({
					targets: transports,
				})
				: undefined,
		);

		return logger;
	},
	inject: [ConfigService],
};

