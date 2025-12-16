import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { databaseProviders } from './provider/datasourse';
import { userRepository } from './provider/repository/user.provider';
import { profileRepository } from './provider/repository/profile.provider';
import { codeProviders } from './provider/code.provider.registration';
import { ApplicationModule } from '@application/application.module';
import { ControllerModule } from '@infrastructure/routers/api';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';
import { appConfig, envValidationSchema } from '@config';
import type { AppConfig } from '@config';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [appConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig>) => {
        const appConfig = configService.get<AppConfig>('app', { infer: true });
        const redisConfig = appConfig?.redis;

        return {
          store: await redisStore({
            socket: {
              host: redisConfig?.host ?? 'localhost',
              port: redisConfig?.port ?? 6379,
            },
          }),
          ttl: 3600, // 1 hour default TTL
        };
      },
      inject: [ConfigService],
    }),
    PassportModule,
    ApplicationModule,
    ControllerModule,
  ],
  providers: [
    ...databaseProviders,
    ...userRepository,
    ...profileRepository,
    ...codeProviders,
    JwtStrategy,
    LocalStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
  exports: [...databaseProviders, ...userRepository, ...profileRepository],
})
export class AppModule { }
