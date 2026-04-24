import { Module, Global } from '@nestjs/common';
import { databaseProviders } from './provider/datasourse';
import { userRepository } from './provider/repository/user.provider';
import { profileRepository } from './provider/repository/profile.provider';
import { tokenRepository } from './provider/repository/token.provider';
import { codeRepository } from './provider/repository/code.provider';
import { roleRepository } from './provider/repository/role.provider';
import { auditLogRepository } from './provider/repository/audit-log.provider';
import { trackingRepository } from './provider/repository/tracking.provider';
import { productRepository } from './provider/repository/product.provider';
import { recipeTypeRepository } from './provider/repository/recipe-type.provider';
import { recipeRepository } from './provider/repository/recipe.provider';
import { reviewRepository } from './provider/repository/review.provider';
import { favoriteRepository } from './provider/repository/favorite.provider';
import { codeProviders } from './provider/code.provider.registration';
import { CodeService } from '@application/service/code.service';
import { DomainCodeService } from '@domain/service/code.serviece';
import { RoleInitService } from './service/role-init.service';
import { pinoLoggerProvider } from './provider/logger/pino-logger.provider';
import { ViewCacheService } from './service/view-cache.service';
import { ViewCacheCronService } from './service/view-cache-cron.service';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Global()
@Module({
	providers: [
		...databaseProviders,
		pinoLoggerProvider,
		...userRepository,
		...profileRepository,
		...tokenRepository,
		...codeRepository,
		...roleRepository,
		...auditLogRepository,
		...trackingRepository,
		...productRepository,
		...recipeTypeRepository,
		...recipeRepository,
		...reviewRepository,
		...favoriteRepository,
		...codeProviders,
		DomainCodeService,
		RoleInitService,
		{
			provide: PROVIDER_CONSTANTS.CODE_SERVICE,
			useClass: CodeService,
		},
		ViewCacheService,
		ViewCacheCronService,
	],
	exports: [
		ViewCacheService,
		...databaseProviders,
		pinoLoggerProvider,
		...userRepository,
		...profileRepository,
		...tokenRepository,
		...codeRepository,
		...roleRepository,
		...auditLogRepository,
		...trackingRepository,
		...productRepository,
		...recipeTypeRepository,
		...recipeRepository,
		...reviewRepository,
		...favoriteRepository,
		...codeProviders,
		PROVIDER_CONSTANTS.CODE_SERVICE,
		ViewCacheService,
	],
})
export class InfrastructureModule { }
