import type { ConfigType } from '@nestjs/config';

import appConfig from './app.config';
import { envValidationSchema } from './validation';

export type AppConfig = ConfigType<typeof appConfig>;

export { appConfig, envValidationSchema };
