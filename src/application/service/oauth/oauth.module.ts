import { forwardRef, Module } from "@nestjs/common";
import { OAuthService } from "./oauth.service";
import { GoogleStrategy } from "./google.strategy";
import { OAuthStrategyFactory } from "./strategy.factory";
import { DomainUserService } from "@domain/service/user.serviece";
import { AuditLogService } from "@application/service/audit-log.service";
import { NotificationRegistrationObservable } from "@application/service/observable/notification.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { AppConfig } from "@config";
import { ApplicationModule } from "@application/application.module";

@Module({
	imports: [
		forwardRef(() => ApplicationModule),
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
		GoogleStrategy,
		DomainUserService,
		AuditLogService,
		NotificationRegistrationObservable,
		{
			provide: OAuthStrategyFactory,
			useFactory: (googleStrategy: GoogleStrategy) => {
				return new OAuthStrategyFactory([googleStrategy]);
			},
			inject: [GoogleStrategy],
		},
		OAuthService,
	],
	exports: [OAuthService],
})
export class OAuthModule { }
