import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AuditLog, AuditLogAction } from '@domain/entities/audit-log.entity';
import { User } from '@domain/entities/user.entity';

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath, override: true });

const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'app_auth',
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[randInt(0, arr.length - 1)];
}

async function seedAuditLogs() {
  console.log('📊 DB config:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.username}`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [path.join(projectRoot, 'src/**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const auditRepo = dataSource.getRepository(AuditLog);
    const userRepo = dataSource.getRepository(User);

    const users = await userRepo.find({ take: 200 });

    const days = Number(process.env.SEED_DAYS ?? 14);
    const registrationsPerDay = Number(process.env.SEED_REGISTRATIONS_PER_DAY ?? 3);
    const loginsPerDay = Number(process.env.SEED_LOGINS_PER_DAY ?? 12);

    const now = new Date();

    let created = 0;

    for (let d = days - 1; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);

      for (let i = 0; i < registrationsPerDay; i++) {
        const at = new Date(day);
        at.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), randInt(0, 999));

        const action =
          Math.random() < 0.2
            ? AuditLogAction.OAUTH_REGISTRATION_SUCCESS
            : AuditLogAction.SIGN_UP_SUCCESS;

        const log = auditRepo.create({
          user: pickRandom(users),
          action,
          ipAddress: '127.0.0.1',
          userAgent: 'seed-script',
          deviceInfo: 'seed',
          success: true,
          createdAt: at,
        } as DeepPartial<AuditLog>);

        await auditRepo.save(log);
        created++;
      }

      for (let i = 0; i < loginsPerDay; i++) {
        const at = new Date(day);
        at.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), randInt(0, 999));

        const action =
          Math.random() < 0.2 ? AuditLogAction.OAUTH_LOGIN_SUCCESS : AuditLogAction.SIGN_IN_SUCCESS;

        const log = auditRepo.create({
          user: pickRandom(users),
          action,
          ipAddress: '127.0.0.1',
          userAgent: 'seed-script',
          deviceInfo: 'seed',
          success: true,
          createdAt: at,
        } as DeepPartial<AuditLog>);

        await auditRepo.save(log);
        created++;
      }
    }

    console.log(`✓ Seeded audit logs: ${created}`);
  } finally {
    await dataSource.destroy();
  }
}

seedAuditLogs().catch((e) => {
  console.error('Seed audit logs failed:', e);
  process.exitCode = 1;
});
