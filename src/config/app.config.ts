import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV ?? 'development',
	port: Number(process.env.APP_PORT ?? 3000),
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 5432),
		name: process.env.DB_NAME ?? 'constructor_auth',
		username: process.env.DB_USER ?? 'postgres',
		password: process.env.DB_PASSWORD ?? '',
	},
	jwt: {
		secret: process.env.JWT_SECRET ?? 'your-secret-key',
		accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
	},
	mailer: {
		host: process.env.MAIL_HOST ?? 'smtp.yandex.ru',
		port: Number(process.env.MAIL_PORT ?? 587),
		user: process.env.MAIL_USER ?? 'constructor-mini@yandex.ru',
		password: process.env.MAIL_PASSWORD ?? 'zuvfwhdaqsvkjopi',
		from: process.env.MAIL_FROM ?? 'constructor-mini@yandex.ru',
		secure: process.env.MAIL_SECURE !== 'false', // true for SSL (port 465), false for TLS (port 587)
	},
	code: {
		length: process.env.CODE_LENGTH ? Number(process.env.CODE_LENGTH) : 5,
	},
	encryption: {
		secret: process.env.ENCRYPTION_SECRET ?? 'your-encryption-secret',
	},
	oauth: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
		},
	},
	redis: {
		host: process.env.REDIS_HOST ?? 'localhost',
		port: Number(process.env.REDIS_PORT ?? 6379),
	},
}));

