import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@domain/entities/user.entity';
import { Profile } from '@domain/entities/profile.entity';
import { Code } from '@domain/entities/code.entity';
import { Token } from '@domain/entities/token.entity';
import { Role } from '@domain/entities/role.entity';
import { AuditLog } from '@domain/entities/audit-log.entity';
import { Tracking } from '@domain/entities/tracking.entity';
import { Product } from '@domain/entities/product.entity';
import { RecipeType } from '@domain/entities/recipe-type.entity';
import { Recipe } from '@domain/entities/recipe.entity';
import { Review } from '@domain/entities/review.entity';
import { Favorite } from '@domain/entities/favorite.entity';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

export const databaseProviders = [
  {
    provide: PROVIDER_CONSTANTS.DATA_SOURCE,
    useFactory: async (configService: ConfigService) => {
      const appConfig = configService.get('app', { infer: true });
      const dataSource = new DataSource({
        type: 'postgres',
        host: appConfig?.database.host ?? 'localhost',
        port: appConfig?.database.port ?? 5432,
        username: appConfig?.database.username ?? 'postgres',
        password: appConfig?.database.password ?? '',
        database: appConfig?.database.name ?? 'constructor_auth',
        entities: [
          User,
          Profile,
          Code,
          Token,
          Role,
          AuditLog,
          Tracking,
          Product,
          RecipeType,
          Recipe,
          Review,
          Favorite,
        ],
        synchronize: true,
        logging: appConfig?.nodeEnv === 'development',
      });

      try {
        const initialized = await dataSource.initialize();
        console.log('Database connection established successfully');
        return initialized;
      } catch (error) {
        console.error('Failed to initialize database connection:', error);
        throw error;
      }
    },
    inject: [ConfigService],
  },
];
