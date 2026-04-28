import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Product } from '@domain/entities/product.entity';
import { Recipe } from '@domain/entities/recipe.entity';
import { RecipeType } from '@domain/entities/recipe-type.entity';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import type { RecipeImage, RecipeStepsConfig } from '@domain/entities/recipe.entity';

const projectRoot = path.resolve(__dirname, '..');

const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');

console.log(`📁 Загрузка переменных окружения из:`);
console.log(`   ${envPath}`);
console.log(`   ${envLocalPath}\n`);

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  const error = envResult.error as NodeJS.ErrnoException;
  if (error.code !== 'ENOENT') {
    console.warn('⚠ Предупреждение при загрузке .env:', error.message);
  } else {
    console.warn('⚠ Файл .env не найден, используются системные переменные окружения');
  }
} else {
  console.log('✓ .env файл загружен');
}

const envLocalResult = dotenv.config({ path: envLocalPath, override: true });
if (envLocalResult.error) {
  const error = envLocalResult.error as NodeJS.ErrnoException;
  if (error.code !== 'ENOENT') {
    console.warn('⚠ Предупреждение при загрузке .env.local:', error.message);
  }
} else {
  console.log('✓ .env.local файл загружен (переопределяет .env)');
}

if (process.env.DB_PASSWORD) {
  console.log(`✓ DB_PASSWORD найден (${process.env.DB_PASSWORD.length} символов)\n`);
} else {
  console.warn('⚠ DB_PASSWORD не найден в переменных окружения!\n');
}

function getProductImageUrl(productName: string, type: 'cover' | 'preview' = 'cover'): string {
  const imageMap: Record<string, { cover: string; preview: string }> = {
    Помидор: {
      cover: 'https://images.unsplash.com/photo-1546097491-c36e4d1c0e3e?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1546097491-c36e4d1c0e3e?w=400&h=300&fit=crop',
    },
    Огурец: {
      cover: 'https://images.unsplash.com/photo-1604977043462-896d7c0e2e5a?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1604977043462-896d7c0e2e5a?w=400&h=300&fit=crop',
    },
    Морковь: {
      cover: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop',
    },
    'Лук репчатый': {
      cover: 'https://images.unsplash.com/photo-1618512496249-3d43e7b1e0e3?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1618512496249-3d43e7b1e0e3?w=400&h=300&fit=crop',
    },
    Чеснок: {
      cover: 'https://images.unsplash.com/photo-1607613009820-a29f7a9b8b8b?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1607613009820-a29f7a9b8b8b?w=400&h=300&fit=crop',
    },
    'Капуста белокочанная': {
      cover: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=300&fit=crop',
    },
    'Капуста цветная': {
      cover: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
    },
    Брокколи: {
      cover: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=300&fit=crop',
    },
    Баклажан: {
      cover: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
    },
    Кабачок: {
      cover: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
    },
    'Перец болгарский': {
      cover: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop',
    },
    Свекла: {
      cover: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop',
    },
    Картофель: {
      cover: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=300&fit=crop',
    },
    Тыква: {
      cover: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop',
    },
    Шпинат: {
      cover: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
    },
    'Салат листовой': {
      cover: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop',
    },
    Яблоко: {
      cover: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=300&fit=crop',
    },
    Банан: {
      cover: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
    },
    Апельсин: {
      cover: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400&h=300&fit=crop',
    },
    'Куриная грудка': {
      cover: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
    },
    Лосось: {
      cover: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=400&h=300&fit=crop',
    },
    'Творог 5%': {
      cover: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop',
    },
    'Яйцо куриное': {
      cover: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop',
    },
    'Рис белый': {
      cover: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    },
    Макароны: {
      cover: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    },
    'Масло оливковое': {
      cover: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400&h=300&fit=crop',
    },
    'Сыр твердый': {
      cover: 'https://images.unsplash.com/photo-1618164436269-61398897a3a6?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1618164436269-61398897a3a6?w=400&h=300&fit=crop',
    },
    Гречка: {
      cover: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    },
    Овсянка: {
      cover: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    },
    Говядина: {
      cover: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
    },
    Свинина: {
      cover: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
    },
    Тунец: {
      cover: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=400&h=300&fit=crop',
    },
    Креветки: {
      cover: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=400&h=300&fit=crop',
    },
    'Молоко 3.2%': {
      cover: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop',
    },
    'Йогурт натуральный': {
      cover: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop',
    },
    'Сыр моцарелла': {
      cover: 'https://images.unsplash.com/photo-1618164436269-61398897a3a6?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1618164436269-61398897a3a6?w=400&h=300&fit=crop',
    },
    Клубника: {
      cover: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=300&fit=crop',
    },
    Малина: {
      cover: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=300&fit=crop',
    },
    Виноград: {
      cover: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=300&fit=crop',
    },
    'Грибы шампиньоны': {
      cover: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
      preview: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    },
  };

  const images = imageMap[productName];
  if (images) {
    return images[type];
  }

  // Fallback: используем общее изображение еды из Unsplash
  const seed = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIds = [
    '1542838132-92c53300491e', // овощи
    '1565299624946-b28f40a0ae38', // еда
    '1565958011703-398f194be75d', // еда
    '1504674900247-0877df9cc836', // еда
    '1555939594-58d7cb561ad1', // еда
    '1567620905732-2d1ec7ab7445', // еда
    '1504674900247-0877df9cc836', // еда
    '1555939594-58d7cb561ad1', // еда
  ];
  const imageId = imageIds[seed % imageIds.length];
  return `https://images.unsplash.com/photo-${imageId}?w=${type === 'cover' ? 800 : 400}&h=${type === 'cover' ? 600 : 300}&fit=crop`;
}

// Данные для продуктов
const PRODUCTS_DATA = [
  // Овощи
  { name: 'Помидор', calories: 18, massa: 100 },
  { name: 'Огурец', calories: 16, massa: 100 },
  { name: 'Морковь', calories: 41, massa: 100 },
  { name: 'Лук репчатый', calories: 47, massa: 100 },
  { name: 'Чеснок', calories: 149, massa: 100 },
  { name: 'Капуста белокочанная', calories: 27, massa: 100 },
  { name: 'Капуста цветная', calories: 30, massa: 100 },
  { name: 'Брокколи', calories: 34, massa: 100 },
  { name: 'Баклажан', calories: 24, massa: 100 },
  { name: 'Кабачок', calories: 24, massa: 100 },
  { name: 'Перец болгарский', calories: 27, massa: 100 },
  { name: 'Свекла', calories: 43, massa: 100 },
  { name: 'Картофель', calories: 77, massa: 100 },
  { name: 'Тыква', calories: 26, massa: 100 },
  { name: 'Шпинат', calories: 23, massa: 100 },
  { name: 'Салат листовой', calories: 15, massa: 100 },
  { name: 'Редис', calories: 20, massa: 100 },
  { name: 'Редька', calories: 36, massa: 100 },
  { name: 'Репа', calories: 30, massa: 100 },
  { name: 'Кукуруза', calories: 86, massa: 100 },
  { name: 'Горошек зеленый', calories: 81, massa: 100 },
  { name: 'Фасоль стручковая', calories: 31, massa: 100 },
  { name: 'Спаржа', calories: 20, massa: 100 },
  { name: 'Артишок', calories: 47, massa: 100 },
  { name: 'Цуккини', calories: 17, massa: 100 },

  // Фрукты
  { name: 'Яблоко', calories: 52, massa: 100 },
  { name: 'Банан', calories: 89, massa: 100 },
  { name: 'Апельсин', calories: 47, massa: 100 },
  { name: 'Грейпфрут', calories: 42, massa: 100 },
  { name: 'Лимон', calories: 29, massa: 100 },
  { name: 'Мандарин', calories: 53, massa: 100 },
  { name: 'Груша', calories: 57, massa: 100 },
  { name: 'Персик', calories: 39, massa: 100 },
  { name: 'Абрикос', calories: 48, massa: 100 },
  { name: 'Слива', calories: 46, massa: 100 },
  { name: 'Вишня', calories: 52, massa: 100 },
  { name: 'Черешня', calories: 50, massa: 100 },
  { name: 'Клубника', calories: 32, massa: 100 },
  { name: 'Малина', calories: 52, massa: 100 },
  { name: 'Черника', calories: 57, massa: 100 },
  { name: 'Виноград', calories: 69, massa: 100 },
  { name: 'Арбуз', calories: 30, massa: 100 },
  { name: 'Дыня', calories: 34, massa: 100 },
  { name: 'Ананас', calories: 50, massa: 100 },
  { name: 'Манго', calories: 60, massa: 100 },
  { name: 'Киви', calories: 61, massa: 100 },
  { name: 'Гранат', calories: 83, massa: 100 },

  // Мясо и птица
  { name: 'Куриная грудка', calories: 165, massa: 100 },
  { name: 'Куриное бедро', calories: 209, massa: 100 },
  { name: 'Индейка грудка', calories: 135, massa: 100 },
  { name: 'Говядина', calories: 250, massa: 100 },
  { name: 'Свинина', calories: 242, massa: 100 },
  { name: 'Баранина', calories: 294, massa: 100 },
  { name: 'Телятина', calories: 172, massa: 100 },
  { name: 'Кролик', calories: 183, massa: 100 },
  { name: 'Печень куриная', calories: 136, massa: 100 },
  { name: 'Печень говяжья', calories: 127, massa: 100 },

  // Рыба и морепродукты
  { name: 'Лосось', calories: 208, massa: 100 },
  { name: 'Тунец', calories: 144, massa: 100 },
  { name: 'Треска', calories: 82, massa: 100 },
  { name: 'Креветки', calories: 99, massa: 100 },
  { name: 'Кальмар', calories: 92, massa: 100 },
  { name: 'Мидии', calories: 77, massa: 100 },
  { name: 'Устрицы', calories: 81, massa: 100 },
  { name: 'Краб', calories: 87, massa: 100 },
  { name: 'Сельдь', calories: 161, massa: 100 },
  { name: 'Скумбрия', calories: 191, massa: 100 },

  // Молочные продукты
  { name: 'Молоко 3.2%', calories: 64, massa: 100 },
  { name: 'Молоко обезжиренное', calories: 31, massa: 100 },
  { name: 'Творог 5%', calories: 121, massa: 100 },
  { name: 'Творог обезжиренный', calories: 88, massa: 100 },
  { name: 'Сыр твердый', calories: 363, massa: 100 },
  { name: 'Сыр моцарелла', calories: 280, massa: 100 },
  { name: 'Сыр фета', calories: 264, massa: 100 },
  { name: 'Йогурт натуральный', calories: 59, massa: 100 },
  { name: 'Сметана 20%', calories: 206, massa: 100 },
  { name: 'Сливки 33%', calories: 322, massa: 100 },
  { name: 'Масло сливочное', calories: 748, massa: 100 },
  { name: 'Кефир', calories: 41, massa: 100 },

  // Крупы и зерновые
  { name: 'Рис белый', calories: 365, massa: 100 },
  { name: 'Рис бурый', calories: 337, massa: 100 },
  { name: 'Гречка', calories: 343, massa: 100 },
  { name: 'Овсянка', calories: 389, massa: 100 },
  { name: 'Пшено', calories: 378, massa: 100 },
  { name: 'Перловка', calories: 315, massa: 100 },
  { name: 'Булгур', calories: 342, massa: 100 },
  { name: 'Киноа', calories: 368, massa: 100 },
  { name: 'Макароны', calories: 371, massa: 100 },
  { name: 'Хлеб белый', calories: 266, massa: 100 },
  { name: 'Хлеб ржаной', calories: 259, massa: 100 },
  { name: 'Хлеб цельнозерновой', calories: 247, massa: 100 },

  // Орехи и семена
  { name: 'Миндаль', calories: 579, massa: 100 },
  { name: 'Грецкий орех', calories: 654, massa: 100 },
  { name: 'Арахис', calories: 567, massa: 100 },
  { name: 'Кешью', calories: 553, massa: 100 },
  { name: 'Фисташки', calories: 560, massa: 100 },
  { name: 'Семена подсолнечника', calories: 584, massa: 100 },
  { name: 'Семена льна', calories: 534, massa: 100 },
  { name: 'Семена чиа', calories: 486, massa: 100 },

  // Масла и жиры
  { name: 'Масло подсолнечное', calories: 884, massa: 100 },
  { name: 'Масло оливковое', calories: 884, massa: 100 },
  { name: 'Масло кокосовое', calories: 862, massa: 100 },
  { name: 'Масло льняное', calories: 884, massa: 100 },

  // Яйца
  { name: 'Яйцо куриное', calories: 157, massa: 100 },
  { name: 'Яичный белок', calories: 52, massa: 100 },
  { name: 'Яичный желток', calories: 322, massa: 100 },
];

// Данные для типов рецептов
const RECIPE_TYPES = [
  'Завтрак',
  'Обед',
  'Ужин',
  'Десерт',
  'Закуска',
  'Салат',
  'Супы',
  'Выпечка',
  'Напитки',
  'Смузи',
];

// Данные для рецептов
const RECIPES_DATA = [
  {
    name: 'Омлет с овощами',
    type: 'Завтрак',
    calories: 250,
    cookAt: 900,
    description: 'Сытный и полезный завтрак с овощами',
    products: ['Яйцо куриное', 'Помидор', 'Перец болгарский', 'Лук репчатый', 'Масло оливковое'],
    steps: [
      { name: 'Подготовка овощей', description: 'Нарежьте помидоры, перец и лук мелкими кубиками' },
      { name: 'Взбивание яиц', description: 'Взбейте яйца с солью и перцем' },
      { name: 'Обжарка овощей', description: 'Обжарьте овощи на сковороде 3-4 минуты' },
      {
        name: 'Приготовление омлета',
        description: 'Влейте яйца к овощам и готовьте на среднем огне 5-7 минут',
      },
    ],
  },
  {
    name: 'Салат Цезарь',
    type: 'Салат',
    calories: 320,
    cookAt: 600,
    description: 'Классический салат с курицей и соусом',
    products: ['Куриная грудка', 'Салат листовой', 'Сыр твердый', 'Хлеб белый', 'Масло оливковое'],
    steps: [
      { name: 'Приготовление курицы', description: 'Обжарьте куриную грудку до готовности' },
      { name: 'Подготовка салата', description: 'Промойте и порвите листья салата' },
      { name: 'Гренки', description: 'Нарежьте хлеб кубиками и обжарьте до золотистого цвета' },
      { name: 'Сборка салата', description: 'Смешайте все ингредиенты и заправьте соусом' },
    ],
  },
  {
    name: 'Паста Карбонара',
    type: 'Обед',
    calories: 580,
    cookAt: 1200,
    description: 'Итальянская паста с беконом и сыром',
    products: ['Макароны', 'Яйцо куриное', 'Сыр твердый', 'Масло сливочное'],
    steps: [
      {
        name: 'Варка пасты',
        description: 'Отварите макароны в подсоленной воде до состояния аль денте',
      },
      { name: 'Подготовка соуса', description: 'Взбейте яйца с тертым сыром' },
      { name: 'Обжарка бекона', description: 'Обжарьте бекон до хрустящего состояния' },
      { name: 'Смешивание', description: 'Смешайте пасту с соусом и беконом, подавайте горячим' },
    ],
  },
  {
    name: 'Куриный суп',
    type: 'Супы',
    calories: 180,
    cookAt: 2400,
    description: 'Наваристый куриный суп с овощами',
    products: ['Куриная грудка', 'Морковь', 'Лук репчатый', 'Картофель', 'Лапша'],
    steps: [
      {
        name: 'Приготовление бульона',
        description: 'Сварите куриную грудку в подсоленной воде 30 минут',
      },
      { name: 'Подготовка овощей', description: 'Нарежьте овощи кубиками' },
      { name: 'Добавление овощей', description: 'Добавьте овощи в бульон и варите 15 минут' },
      { name: 'Добавление лапши', description: 'Добавьте лапшу и варите еще 5-7 минут' },
    ],
  },
  {
    name: 'Греческий салат',
    type: 'Салат',
    calories: 220,
    cookAt: 600,
    description: 'Свежий салат с фетой и оливками',
    products: [
      'Помидор',
      'Огурец',
      'Перец болгарский',
      'Сыр фета',
      'Масло оливковое',
      'Лук репчатый',
    ],
    steps: [
      { name: 'Нарезка овощей', description: 'Нарежьте все овощи крупными кубиками' },
      { name: 'Подготовка сыра', description: 'Нарежьте сыр фета кубиками' },
      { name: 'Смешивание', description: 'Смешайте все ингредиенты' },
      { name: 'Заправка', description: 'Заправьте салат оливковым маслом и лимонным соком' },
    ],
  },
  {
    name: 'Лосось на пару',
    type: 'Ужин',
    calories: 280,
    cookAt: 900,
    description: 'Нежный лосось с овощами на пару',
    products: ['Лосось', 'Брокколи', 'Морковь', 'Лимон'],
    steps: [
      { name: 'Подготовка рыбы', description: 'Нарежьте лосось порционными кусками' },
      { name: 'Подготовка овощей', description: 'Нарежьте овощи для гарнира' },
      { name: 'Приготовление на пару', description: 'Готовьте рыбу и овощи на пару 10-12 минут' },
      { name: 'Подача', description: 'Подавайте с дольками лимона' },
    ],
  },
  {
    name: 'Творожная запеканка',
    type: 'Завтрак',
    calories: 240,
    cookAt: 1800,
    description: 'Нежная творожная запеканка',
    products: ['Творог 5%', 'Яйцо куриное', 'Сметана 20%', 'Мука'],
    steps: [
      { name: 'Подготовка теста', description: 'Смешайте творог с яйцами и сметаной' },
      { name: 'Добавление муки', description: 'Добавьте муку и перемешайте до однородности' },
      { name: 'Выпечка', description: 'Выложите в форму и запекайте 30 минут при 180°C' },
      { name: 'Подача', description: 'Подавайте теплой с ягодами' },
    ],
  },
  {
    name: 'Борщ',
    type: 'Супы',
    calories: 95,
    cookAt: 3600,
    description: 'Традиционный украинский борщ',
    products: [
      'Свекла',
      'Капуста белокочанная',
      'Морковь',
      'Лук репчатый',
      'Картофель',
      'Говядина',
    ],
    steps: [
      { name: 'Приготовление бульона', description: 'Сварите мясной бульон' },
      {
        name: 'Подготовка овощей',
        description: 'Натрите свеклу и морковь, нарежьте капусту и картофель',
      },
      { name: 'Обжарка овощей', description: 'Обжарьте свеклу, морковь и лук' },
      { name: 'Варка борща', description: 'Добавьте все овощи в бульон и варите 30-40 минут' },
    ],
  },
  {
    name: 'Стейк из говядины',
    type: 'Ужин',
    calories: 350,
    cookAt: 1200,
    description: 'Сочный стейк средней прожарки',
    products: ['Говядина', 'Масло сливочное', 'Чеснок', 'Розмарин'],
    steps: [
      { name: 'Подготовка мяса', description: 'Доведите мясо до комнатной температуры' },
      { name: 'Обжарка', description: 'Обжарьте стейк по 3-4 минуты с каждой стороны' },
      { name: 'Ароматизация', description: 'Добавьте масло, чеснок и розмарин' },
      { name: 'Отдых', description: 'Дайте стейку отдохнуть 5 минут перед подачей' },
    ],
  },
  {
    name: 'Смузи из ягод',
    type: 'Смузи',
    calories: 120,
    cookAt: 300,
    description: 'Освежающий ягодный смузи',
    products: ['Клубника', 'Малина', 'Черника', 'Банан', 'Йогурт натуральный'],
    steps: [
      { name: 'Подготовка фруктов', description: 'Промойте ягоды и очистите банан' },
      { name: 'Смешивание', description: 'Смешайте все ингредиенты в блендере' },
      { name: 'Подача', description: 'Подавайте сразу после приготовления' },
    ],
  },
];

// Тип для данных рецепта
type RecipeData = {
  name: string;
  type: string;
  calories: number;
  cookAt: number;
  description: string;
  products: string[];
  steps: Array<{ name: string; description: string }>;
};

// Генерация дополнительных рецептов
function generateAdditionalRecipes(): RecipeData[] {
  const additionalRecipes: RecipeData[] = [];
  const recipeNames = [
    'Овсяная каша с фруктами',
    'Тост с авокадо',
    'Сырники',
    'Блины',
    'Яичница глазунья',
    'Сэндвич с индейкой',
    'Куриные крылышки',
    'Рыбные котлеты',
    'Овощное рагу',
    'Тушеная капуста',
    'Гречка с грибами',
    'Плов',
    'Паста Болоньезе',
    'Лазанья',
    'Пицца Маргарита',
    'Куриные наггетсы',
    'Фрикадельки',
    'Голубцы',
    'Пельмени',
    'Вареники',
    'Окрошка',
    'Холодник',
    'Солянка',
    'Уха',
    'Куриный бульон',
    'Овощной суп',
    'Грибной суп',
    'Тыквенный суп',
    'Тирамису',
    'Чизкейк',
    'Брауни',
    'Печенье овсяное',
    'Морковный торт',
    'Яблочный пирог',
    'Шарлотка',
    'Оладьи',
    'Вафли',
    'Панкейки',
    'Фруктовый салат',
    'Салат Оливье',
    'Винегрет',
    'Сельдь под шубой',
    'Крабовый салат',
    'Салат с тунцом',
  ];

  const types = RECIPE_TYPES;
  const baseProducts = PRODUCTS_DATA.map((p) => p.name);

  for (let i = 0; i < 40; i++) {
    const name = recipeNames[i] || `Рецепт ${i + 1}`;
    const type = types[Math.floor(Math.random() * types.length)];
    const calories = Math.floor(Math.random() * 500) + 150;
    const cookAt = Math.floor(Math.random() * 2400) + 600;
    const productCount = Math.floor(Math.random() * 5) + 3;
    const selectedProducts: string[] = [];
    for (let j = 0; j < productCount; j++) {
      const product = baseProducts[Math.floor(Math.random() * baseProducts.length)];
      if (!selectedProducts.includes(product)) {
        selectedProducts.push(product);
      }
    }

    const stepCount = Math.floor(Math.random() * 4) + 3;
    const steps: Array<{ name: string; description: string }> = [];
    for (let j = 0; j < stepCount; j++) {
      steps.push({
        name: `Шаг ${j + 1}`,
        description: `Описание шага ${j + 1} для рецепта ${name}`,
      });
    }

    additionalRecipes.push({
      name,
      type,
      calories,
      cookAt,
      description: `Вкусный рецепт ${name.toLowerCase()}`,
      products: selectedProducts,
      steps,
    });
  }

  return additionalRecipes;
}

async function seedDatabase() {
  console.log('🌱 Начало заполнения базы данных...\n');

  // Получение конфигурации из переменных окружения
  // Используем значения из docker-compose.yml по умолчанию
  const dbConfig = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres', // Из docker-compose.yml: POSTGRES_USER
    password: process.env.DB_PASSWORD ?? 'postgres', // Из docker-compose.yml: POSTGRES_PASSWORD
    database: process.env.DB_NAME ?? 'app_auth', // Из docker-compose.yml: POSTGRES_DB
  };

  // Пароль теперь имеет значение по умолчанию из docker-compose.yml ('postgres')
  // Если нужно использовать другой пароль, задайте его в .env файле

  console.log(`📊 Конфигурация БД:`);
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.username}`);
  console.log(`   Password: ${dbConfig.password ? dbConfig.password : 'НЕ УКАЗАН'}\n`);

  // Создание DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [Product, Recipe, RecipeType, User, Role],
    synchronize: false,
    logging: false,
  });

  try {
    // Подключение к БД
    console.log('🔄 Попытка подключения к базе данных...');
    await dataSource.initialize();
    console.log('✓ Подключение к базе данных установлено\n');

    const productRepository = dataSource.getRepository(Product);
    const recipeRepository = dataSource.getRepository(Recipe);
    const recipeTypeRepository = dataSource.getRepository(RecipeType);

    // 1. Создание типов рецептов
    console.log('📝 Создание типов рецептов...');
    const recipeTypesMap = new Map<string, RecipeType>();

    for (const typeName of RECIPE_TYPES) {
      let recipeType = await recipeTypeRepository.findOne({ where: { name: typeName } });
      if (!recipeType) {
        recipeType = recipeTypeRepository.create({ name: typeName });
        recipeType = await recipeTypeRepository.save(recipeType);
      }
      recipeTypesMap.set(typeName, recipeType);
      console.log(`  ✓ ${typeName}`);
    }
    console.log(`\n✓ Создано/найдено ${recipeTypesMap.size} типов рецептов\n`);

    // 2. Создание продуктов
    console.log('🥬 Создание продуктов...');
    const productsMap = new Map<string, Product>();
    let createdProducts = 0;
    let existingProducts = 0;

    for (const productData of PRODUCTS_DATA) {
      let product = await productRepository.findOne({ where: { name: productData.name } });
      if (!product) {
        // Создаем изображения для продукта
        const productImage = {
          cover: getProductImageUrl(productData.name, 'cover'),
          preview: getProductImageUrl(productData.name, 'preview'),
        };

        product = productRepository.create({
          name: productData.name,
          calories: productData.calories,
          massa: productData.massa,
          image: productImage,
          imageMediaIds: null,
          countFavorites: 0,
          isFluff: false,
        });
        product = await productRepository.save(product);
        createdProducts++;
      } else {
        existingProducts++;
      }
      productsMap.set(productData.name, product);
    }

    // Дополнительные продукты до 100+
    const additionalProducts = [
      { name: 'Грибы шампиньоны', calories: 27, massa: 100 },
      { name: 'Грибы белые', calories: 34, massa: 100 },
      { name: 'Имбирь', calories: 80, massa: 100 },
      { name: 'Корица', calories: 247, massa: 100 },
      { name: 'Куркума', calories: 354, massa: 100 },
      { name: 'Паприка', calories: 282, massa: 100 },
      { name: 'Базилик', calories: 22, massa: 100 },
      { name: 'Петрушка', calories: 36, massa: 100 },
      { name: 'Укроп', calories: 40, massa: 100 },
      { name: 'Кинза', calories: 23, massa: 100 },
    ];

    for (const productData of additionalProducts) {
      if (productsMap.size >= 100) break;
      let product = await productRepository.findOne({ where: { name: productData.name } });
      if (!product) {
        // Создаем изображения для продукта
        const productImage = {
          cover: getProductImageUrl(productData.name, 'cover'),
          preview: getProductImageUrl(productData.name, 'preview'),
        };

        product = productRepository.create({
          name: productData.name,
          calories: productData.calories,
          massa: productData.massa,
          image: productImage,
          imageMediaIds: null,
          countFavorites: 0,
          isFluff: false,
        });
        product = await productRepository.save(product);
        createdProducts++;
      }
      productsMap.set(productData.name, product);
    }

    console.log(`  ✓ Создано новых продуктов: ${createdProducts}`);
    console.log(`  ✓ Найдено существующих продуктов: ${existingProducts}`);
    console.log(`  ✓ Всего продуктов в базе: ${productsMap.size}\n`);

    // 3. Создание рецептов
    console.log('🍳 Создание рецептов...');
    const allRecipes = [...RECIPES_DATA, ...generateAdditionalRecipes()];
    let createdRecipes = 0;
    let existingRecipes = 0;

    for (const recipeData of allRecipes) {
      // Проверка существования рецепта
      const existingRecipe = await recipeRepository.findOne({
        where: { name: recipeData.name },
      });

      if (existingRecipe) {
        existingRecipes++;
        continue;
      }

      // Получение типа рецепта
      const recipeType = recipeTypesMap.get(recipeData.type);
      if (!recipeType) {
        console.log(
          `  ⚠ Пропущен рецепт "${recipeData.name}" - тип "${recipeData.type}" не найден`,
        );
        continue;
      }

      // Получение продуктов
      const recipeProducts: Product[] = [];
      for (const productName of recipeData.products) {
        const product = productsMap.get(productName);
        if (product) {
          recipeProducts.push(product);
        }
      }

      if (recipeProducts.length === 0) {
        console.log(`  ⚠ Пропущен рецепт "${recipeData.name}" - нет доступных продуктов`);
        continue;
      }

      // Функция для получения URL изображения рецепта
      const getRecipeImageUrl = (
        recipeName: string,
        type: 'cover' | 'preview' | 'step',
        stepIndex?: number,
      ): string => {
        const recipeImages: Record<string, { cover: string; preview: string }> = {
          'Омлет с овощами': {
            cover:
              'https://images.unsplash.com/photo-1613564834361-60663593842b?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1613564834361-60663593842b?w=400&h=300&fit=crop',
          },
          'Салат Цезарь': {
            cover: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
          },
          'Паста Карбонара': {
            cover:
              'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
          },
          'Куриный суп': {
            cover: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
          },
          'Греческий салат': {
            cover: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
          },
          'Лосось на пару': {
            cover: 'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1544943910-04c1e24a6893?w=400&h=300&fit=crop',
          },
          'Творожная запеканка': {
            cover:
              'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
          },
          Борщ: {
            cover: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
          },
          'Стейк из говядины': {
            cover:
              'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
          },
          'Смузи из ягод': {
            cover: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
            preview:
              'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop',
          },
        };

        if (type === 'step') {
          // Для шагов используем общие изображения готовки
          const stepImages = [
            'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop',
          ];
          return stepImages[(stepIndex || 0) % stepImages.length];
        }

        const images = recipeImages[recipeName];
        if (images) {
          return images[type];
        }

        // Fallback: используем общее изображение еды
        const seed = recipeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const imageIds = [
          '1565299624946-b28f40a0ae38',
          '1504674900247-0877df9cc836',
          '1555939594-58d7cb561ad1',
          '1567620905732-2d1ec7ab7445',
          '1565299624946-b28f40a0ae38',
        ];
        const imageId = imageIds[seed % imageIds.length];
        return `https://images.unsplash.com/photo-${imageId}?w=${type === 'cover' ? 800 : 400}&h=${type === 'cover' ? 600 : 300}&fit=crop`;
      };

      // Создание изображений рецепта
      const image: RecipeImage = {
        cover: getRecipeImageUrl(recipeData.name, 'cover'),
        preview: getRecipeImageUrl(recipeData.name, 'preview'),
      };

      // Создание stepsConfig
      const stepsConfig: RecipeStepsConfig = {
        steps: recipeData.steps.map((step, index) => ({
          name: step.name,
          description: step.description,
          resources: [
            {
              position: index + 1,
              source: getRecipeImageUrl(recipeData.name, 'step', index),
              type: 'image',
            },
          ],
        })),
      };

      // Создание рецепта
      const recipe = recipeRepository.create({
        user: null,
        name: recipeData.name,
        type: recipeType,
        average: 0,
        countFavorites: 0,
        image,
        imageMediaIds: null,
        promotionalVideo: null,
        promotionalVideoMediaId: null,
        description: recipeData.description,
        products: recipeProducts,
        isFluff: false,
        calories: recipeData.calories,
        cookAt: recipeData.cookAt,
        stepsConfig,
      });

      await recipeRepository.save(recipe);
      createdRecipes++;
      console.log(`  ✓ ${recipeData.name} (${recipeData.type})`);
    }

    console.log(`\n✓ Создано новых рецептов: ${createdRecipes}`);
    console.log(`✓ Найдено существующих рецептов: ${existingRecipes}`);
    console.log(`✓ Всего рецептов в базе: ${createdRecipes + existingRecipes}\n`);

    console.log('✅ Заполнение базы данных завершено успешно!');
    console.log(`\n📊 Итоговая статистика:`);
    console.log(`   - Типы рецептов: ${recipeTypesMap.size}`);
    console.log(`   - Продукты: ${productsMap.size}`);
    console.log(`   - Рецепты: ${createdRecipes + existingRecipes}`);
  } catch (error: any) {
    console.error('❌ Ошибка при заполнении базы данных:');
    if (error.code === '28P01') {
      console.error('   Ошибка аутентификации PostgreSQL');
      console.error('   Проверьте правильность пароля в переменной окружения DB_PASSWORD');
      console.error('   Убедитесь, что файл .env или .env.local содержит правильный пароль');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Не удалось подключиться к серверу PostgreSQL');
      console.error('   Убедитесь, что PostgreSQL запущен и доступен по адресу:', dbConfig.host);
    } else if (error.code === '3D000') {
      console.error('   База данных не существует:', dbConfig.database);
      console.error('   Создайте базу данных или проверьте имя в переменной DB_NAME');
    } else {
      console.error('   Детали ошибки:', error.message);
      if (error.code) {
        console.error('   Код ошибки:', error.code);
      }
    }
    throw error;
  } finally {
    // Закрытие соединения
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✓ Соединение с базой данных закрыто');
    }
  }
}

// Запуск скрипта
seedDatabase()
  .then(() => {
    console.log('\n🎉 Скрипт выполнен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  });
