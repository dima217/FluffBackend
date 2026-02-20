import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { createHmac } from 'crypto';

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

// Используем тот же секрет, что и в приложении (из docker-compose.yml по умолчанию)
const encryptionSecret = process.env.ENCRYPTION_SECRET ?? 'your-super-secret-encryption-key-min-10-chars';

console.log(`🔐 Используемый ENCRYPTION_SECRET: ${encryptionSecret.substring(0, 10)}... (${encryptionSecret.length} символов)`);

function encryptPassword(password: string): string {
  return createHmac('sha256', encryptionSecret).update(password).digest('hex');
}

async function createAdmin() {
  console.log('🌱 Создание администратора...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [User, Role],
    synchronize: true, // Включаем синхронизацию для создания таблиц
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Подключение к базе данных установлено');
    
    // Синхронизация схемы для создания таблиц если их нет
    await dataSource.synchronize();
    console.log('✓ Схема базы данных синхронизирована\n');

    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    // Получаем или создаем роль ADMIN
    let adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = roleRepository.create({ name: 'admin', description: 'Administrator role' });
      adminRole = await roleRepository.save(adminRole);
      console.log('✓ Роль ADMIN создана');
    } else {
      console.log('✓ Роль ADMIN найдена');
    }

    // Проверяем, существует ли админ
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@admin.com';
    const adminUsername = process.env.ADMIN_USERNAME ?? 'admin@admin.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

    console.log(`\n🔍 Поиск администратора:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}\n`);

    // Ищем по username (так как adminSignIn использует findOneByUsername)
    let admin = await userRepository.findOne({ 
      where: { username: adminUsername },
      relations: ['roles'],
    });
    
    // Если не найден по username, пробуем найти по email
    if (!admin) {
      admin = await userRepository.findOne({ 
        where: { email: adminEmail },
        relations: ['roles'],
      });
      if (admin) {
        console.log(`⚠ Найден пользователь по email, но username не совпадает!`);
        console.log(`   Текущий username: ${admin.username}`);
        console.log(`   Требуемый username: ${adminUsername}`);
      }
    }

    if (admin) {
      console.log(`⚠ Администратор уже существует`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Username: ${admin.username}`);
      
      // Обновляем данные админа
      admin.isSuper = true;
      admin.isActive = true;
      admin.username = adminUsername; // Убеждаемся, что username правильный
      admin.email = adminEmail; // Убеждаемся, что email правильный
      admin.password = encryptPassword(adminPassword);
      
      // Убеждаемся, что роль ADMIN есть
      if (!admin.roles.some(r => r.name === 'admin')) {
        admin.roles = [...admin.roles, adminRole];
      }
      
      admin = await userRepository.save(admin);
      console.log('✓ Данные администратора обновлены');
    } else {
      // Создаем нового админа
      admin = userRepository.create({
        firstName: 'Admin',
        lastName: 'User',
        username: adminUsername,
        email: adminEmail,
        password: encryptPassword(adminPassword),
        isActive: true,
        isSuper: true,
        roles: [adminRole],
      });

      admin = await userRepository.save(admin);
      console.log('✓ Администратор создан');
    }

    // Проверяем, что пароль правильно зашифрован
    const testEncryption = encryptPassword(adminPassword);
    const passwordMatches = testEncryption === admin.password;
    
    // Проверяем, что пользователь найден по username (как в adminSignIn)
    const foundByUsername = await userRepository.findOne({ where: { username: adminUsername } });
    const usernameFound = foundByUsername?.id === admin.id;
    
    console.log('\n📋 Данные администратора:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password (plain): ${adminPassword}`);
    console.log(`   Encrypted password hash: ${admin.password.substring(0, 20)}...`);
    console.log(`   Password encryption verified: ${passwordMatches ? '✓' : '✗'}`);
    console.log(`   Username lookup verified: ${usernameFound ? '✓' : '✗'}`);
    console.log(`   isSuper: ${admin.isSuper}`);
    console.log(`   isActive: ${admin.isActive}`);
    console.log(`   Roles: ${admin.roles.map(r => r.name).join(', ')}`);
    
    if (!passwordMatches) {
      console.warn('\n⚠ ВНИМАНИЕ: Пароль не совпадает с зашифрованным!');
      console.warn('   Убедитесь, что ENCRYPTION_SECRET одинаковый в .env и docker-compose.yml');
      console.warn(`   Используемый секрет: ${encryptionSecret.substring(0, 20)}...`);
    }
    
    if (!usernameFound) {
      console.warn('\n⚠ ВНИМАНИЕ: Пользователь не найден по username!');
      console.warn(`   Проверьте, что username "${adminUsername}" правильный`);
    }
    
    if (!admin.isSuper) {
      console.warn('\n⚠ ВНИМАНИЕ: isSuper = false!');
      console.warn('   Пользователь не сможет войти через adminSignIn');
    }
    
    if (!admin.isActive) {
      console.warn('\n⚠ ВНИМАНИЕ: isActive = false!');
      console.warn('   Пользователь неактивен');
    }

    await dataSource.destroy();
    console.log('\n✓ Соединение с базой данных закрыто');
    console.log('\n🎉 Администратор готов к использованию!');
  } catch (error) {
    console.error('\n💥 Ошибка:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

createAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  });
