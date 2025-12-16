import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('development', 'production', 'test')
		.default('development'),
	APP_PORT: Joi.number().port().default(3000),
	DB_HOST: Joi.string().hostname().required(),
	DB_PORT: Joi.number().port().default(5432),
	DB_NAME: Joi.string().required(),
	DB_USER: Joi.string().required(),
	DB_PASSWORD: Joi.string().allow('').optional(),
	JWT_SECRET: Joi.string().min(10).required(),
	JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
	JWT_REOST: Joi.string().hostname().optional(),
	MAIL_PFRESH_EXPIRES_IN: Joi.string().default('7d'),
	MAIL_HORT: Joi.number().port().optional(),
	MAIL_USER: Joi.string().optional(),
	MAIL_PASSWORD: Joi.string().optional(),
	MAIL_FROM: Joi.string().email().optional(),
	MAIL_SECURE: Joi.string().valid('true', 'false').optional(),
	CODE_LENGTH: Joi.number().min(4).max(6).optional(),
	ENCRYPTION_SECRET: Joi.string().min(10).required(),
	GOOGLE_CLIENT_ID: Joi.string().optional(),
}).unknown(true);

