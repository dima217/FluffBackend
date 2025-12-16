import { UserAuthService } from "./service/user.auth";
import { UserDetailsService } from "./service/user.details";
import { AuditLogService } from "./service/audit-log.service";
import { ProfileService } from "./service/profile.service";
import { RecipeService } from "./service/recipe.service";
import { ProductService } from "./service/product.service";
import { FavoriteService } from "./service/favorite.service";
import { TrackingService } from "./service/tracking.service";
import { NotificationRegistrationObservable } from "./service/observable/notification.service";
import { PasswordChangeNotificationObservable } from "./service/observable/password-change-notification.service";
import { OAuthModule } from "./service/oauth/oauth.module";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DomainUserService } from "@domain/service/user.serviece";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import type { AppConfig } from "@config";
import { FavoriteProcessManager } from "./service/process/favorite-process.manager";
import { RecipeFavoriteCountProcess } from "./service/process/recipe-favorite-count.process";
import { ProductFavoriteCountProcess } from "./service/process/product-favorite-count.process";

@Module({
	imports: [
		InfrastructureModule,
		OAuthModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService<AppConfig>) => {
				const appConfig = configService.get<AppConfig>("app", { infer: true });
				return {
					secret: appConfig?.jwt.secret,
					signOptions: {
						expiresIn: appConfig?.jwt.accessExpiresIn ?? "15m",
					},
				};
			},
			inject: [ConfigService],
		}),
	],
	providers: [
		UserAuthService,
		DomainUserService,
		UserDetailsService,
		AuditLogService,
		NotificationRegistrationObservable,
		PasswordChangeNotificationObservable,
		ProfileService,
		RecipeService,
		ProductService,
		TrackingService,
		RecipeFavoriteCountProcess,
		ProductFavoriteCountProcess,
		{
			provide: FavoriteProcessManager,
			useFactory: (
				recipeProcess: RecipeFavoriteCountProcess,
				productProcess: ProductFavoriteCountProcess,
			) => {
				const manager = new FavoriteProcessManager([recipeProcess, productProcess]);
				return manager;
			},
			inject: [RecipeFavoriteCountProcess, ProductFavoriteCountProcess],
		},
		FavoriteService,
	],
	exports: [
		UserAuthService,
		UserDetailsService,
		DomainUserService,
		AuditLogService,
		NotificationRegistrationObservable,
		PasswordChangeNotificationObservable,
		OAuthModule,
		ProfileService,
		RecipeService,
		ProductService,
		TrackingService,
		FavoriteService,
	],
})
export class ApplicationModule {
}
