// data-source-cli.ts (в корне проекта, рядом с package.json)
import { DataSource } from 'typeorm';
import { User } from './src/domain/entities/user.entity';
import { Profile } from './src/domain/entities/profile.entity';
import { Code } from './src/domain/entities/code.entity';
import { Token } from './src/domain/entities/token.entity';
import { Role } from './src/domain/entities/role.entity';
import { AuditLog } from './src/domain/entities/audit-log.entity';
import { Tracking } from './src/domain/entities/tracking.entity';
import { Product } from './src/domain/entities/product.entity';
import { RecipeType } from './src/domain/entities/recipe-type.entity';
import { Recipe } from './src/domain/entities/recipe.entity';
import { Review } from './src/domain/entities/review.entity';
import { Favorite } from './src/domain/entities/favorite.entity';
import { Notification } from './src/domain/entities/notification.entity';
import * as dotenv from 'dotenv';
import { SupportTicket } from '@domain/entities/support-ticket.entity';

// Загружаем переменные окружения
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'constructor_auth',
  entities: [
    User,
    Profile,
    Code,
    Token,
    Role,
    AuditLog,
    Tracking,
    Product,
    SupportTicket,
    Notification,
    RecipeType,
    Recipe,
    Review,
    Favorite,
  ],
  migrations: ['src/migrations/*.ts'], // Папка для миграций
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});