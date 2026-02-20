import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from '@domain/entities/user.entity';
import { Recipe } from '@domain/entities/recipe.entity';
import { Product } from '@domain/entities/product.entity';
import { Review } from '@domain/entities/review.entity';
import { Tracking } from '@domain/entities/tracking.entity';
import { Favorite } from '@domain/entities/favorite.entity';
import { Role } from '@domain/entities/role.entity';
import { RecipeType } from '@domain/entities/recipe-type.entity';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

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

// Моковые данные
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const recipeNames = [
  'Spaghetti Carbonara', 'Chicken Stir Fry', 'Beef Tacos', 'Vegetable Soup', 'Grilled Salmon',
  'Chocolate Cake', 'Caesar Salad', 'Pizza Margherita', 'Pancakes', 'Fried Rice',
  'Greek Salad', 'BBQ Ribs', 'Sushi Rolls', 'Pasta Primavera', 'Mushroom Risotto',
  'Chicken Curry', 'Apple Pie', 'Tomato Soup', 'Beef Steak', 'Fish Tacos'
];

const productNames = [
  'Tomatoes', 'Chicken Breast', 'Rice', 'Pasta', 'Olive Oil',
  'Garlic', 'Onions', 'Cheese', 'Eggs', 'Milk',
  'Bread', 'Butter', 'Flour', 'Sugar', 'Salt',
  'Pepper', 'Lemon', 'Potatoes', 'Carrots', 'Broccoli'
];

const reviewTexts = [
  'Amazing recipe! My family loved it.',
  'Good but needs more seasoning.',
  'Excellent! Will make again.',
  'Too complicated for beginners.',
  'Perfect for weeknight dinner.',
  'Delicious and healthy!',
  'Great flavors combination.',
  'Easy to follow instructions.',
  'Restaurant quality at home!',
  'Kids approved recipe!'
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 1): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

async function generateTestData() {
  console.log('🌱 Генерация тестовых данных...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [User, Recipe, Product, Review, Tracking, Favorite, Role, RecipeType],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Подключение к базе данных установлено');

    const userRepository = dataSource.getRepository(User);
    const recipeRepository = dataSource.getRepository(Recipe);
    const productRepository = dataSource.getRepository(Product);
    const reviewRepository = dataSource.getRepository(Review);
    const trackingRepository = dataSource.getRepository(Tracking);
    const favoriteRepository = dataSource.getRepository(Favorite);
    const roleRepository = dataSource.getRepository(Role);

    // Получаем админа
    const admin = await userRepository.findOne({ 
      where: { username: 'admin@admin.com' },
      relations: ['roles']
    });

    if (!admin) {
      console.error('❌ Админ не найден! Сначала запустите npm run create-admin');
      return;
    }

    console.log(`✓ Найден админ: ${admin.username}`);

    // Получаем роль user
    let userRole = await roleRepository.findOne({ where: { name: 'user' } });
    if (!userRole) {
      userRole = roleRepository.create({ name: 'user', description: 'Regular user role' });
      userRole = await roleRepository.save(userRole);
      console.log('✓ Роль USER создана');
    }

    // Создаем базовый тип рецепта
    let recipeType = await dataSource.getRepository(RecipeType).findOne({ where: { name: 'Main Course' } });
    if (!recipeType) {
      recipeType = dataSource.getRepository(RecipeType).create({ 
        name: 'Main Course'
      });
      recipeType = await dataSource.getRepository(RecipeType).save(recipeType);
      console.log('✓ Тип рецепта создан');
    }

    // 1. Создаем 50 пользователей
    console.log('\n👥 Создание пользователей...');
    const users: User[] = [];
    const usedUsernames = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      let username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
      
      // Генерируем уникальный username
      let counter = 0;
      while (usedUsernames.has(username)) {
        counter++;
        username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}_${counter}`;
      }
      usedUsernames.add(username);
      
      const email = `${username}@example.com`;

      const user = userRepository.create({
        firstName,
        lastName,
        username,
        email,
        password: 'password123', // простой пароль для тестов
        isActive: true,
        isSuper: false,
        roles: [userRole]
      });
      users.push(user);
    }
    const savedUsers = await userRepository.save(users);
    console.log(`✓ Создано ${savedUsers.length} пользователей`);

    // 2. Создаем 50 рецептов
    console.log('\n🍳 Создание рецептов...');
    const recipes: Recipe[] = [];
    for (let i = 0; i < 50; i++) {
      const recipe = new Recipe();
      recipe.name = getRandomItem(recipeNames);
      recipe.description = `Delicious recipe number ${i + 1} with amazing flavors`;
      recipe.average = getRandomFloat(3.0, 5.0, 1);
      recipe.user = admin; // Привязываем к админу
      recipe.calories = getRandomNumber(200, 800);
      recipe.cookAt = getRandomNumber(10, 60); // Добавляем cookAt
      recipe.stepsConfig = {
        steps: [
          {
            name: 'Step 1',
            description: 'Prepare all ingredients',
            resources: []
          },
          {
            name: 'Step 2', 
            description: 'Cook everything properly',
            resources: []
          }
        ]
      };
      recipe.image = { cover: '', preview: '' };
      recipe.countFavorites = 0;
      recipe.type = recipeType;
      recipes.push(recipe);
    }
    const savedRecipes = await recipeRepository.save(recipes);
    console.log(`✓ Создано ${savedRecipes.length} рецептов`);

    // 3. Создаем 50 продуктов
    console.log('\n🥕 Создание продуктов...');
    const products: Product[] = [];
    for (let i = 0; i < 50; i++) {
      const product = new Product();
      product.name = getRandomItem(productNames);
      product.calories = getRandomNumber(50, 500);
      product.massa = getRandomNumber(50, 500);
      product.countFavorites = 0;
      product.image = { cover: '', preview: '' };
      products.push(product);
    }
    const savedProducts = await productRepository.save(products);
    console.log(`✓ Создано ${savedProducts.length} продуктов`);

    // 4. Создаем 50 отзывов
    console.log('\n⭐ Создание отзывов...');
    const reviews: Review[] = [];
    for (let i = 0; i < 50; i++) {
      const randomRecipe = getRandomItem(savedRecipes);
      const randomUser = getRandomItem(savedUsers);
      
      const review = new Review();
      review.score = getRandomFloat(1.0, 5.0, 1);
      review.message = getRandomItem(reviewTexts);
      review.user = randomUser;
      review.relatedEntityId = randomRecipe.id.toString();
      review.relatedEntityType = RelatedEntityType.RECIPE;
      reviews.push(review);
    }
    const savedReviews = await reviewRepository.save(reviews);
    console.log(`✓ Создано ${savedReviews.length} отзывов`);

    // 5. Создаем 50 записей трекинга
    console.log('\n📊 Создание записей трекинга...');
    const trackingRecords: Tracking[] = [];
    for (let i = 0; i < 50; i++) {
      const randomRecipe = getRandomItem(savedRecipes);
      const randomUser = getRandomItem(savedUsers);
      
      const tracking = new Tracking();
      tracking.name = randomRecipe.name;
      tracking.calories = randomRecipe.calories || getRandomNumber(200, 800);
      tracking.user = randomUser;
      tracking.recipe = randomRecipe;
      trackingRecords.push(tracking);
    }
    const savedTracking = await trackingRepository.save(trackingRecords);
    console.log(`✓ Создано ${savedTracking.length} записей трекинга`);

    // 6. Создаем 50 избранных
    console.log('\n❤️ Создание избранных...');
    const favorites: Favorite[] = [];
    for (let i = 0; i < 50; i++) {
      const randomRecipe = getRandomItem(savedRecipes);
      const randomProduct = getRandomItem(savedProducts);
      const randomUser = getRandomItem(savedUsers);
      
      // Чередуем рецепты и продукты
      if (Math.random() > 0.5) {
        const favorite = new Favorite();
        favorite.user = randomUser;
        favorite.relatedEntityId = randomRecipe.id;
        favorite.relatedEntityType = RelatedEntityType.RECIPE;
        favorites.push(favorite);
      } else {
        const favorite = new Favorite();
        favorite.user = randomUser;
        favorite.relatedEntityId = randomProduct.id;
        favorite.relatedEntityType = RelatedEntityType.PRODUCT;
        favorites.push(favorite);
      }
    }
    const savedFavorites = await favoriteRepository.save(favorites);
    console.log(`✓ Создано ${savedFavorites.length} избранных`);

    console.log('\n🎉 Все тестовые данные успешно созданы!');
    console.log(`📊 Статистика:`);
    console.log(`   Пользователи: ${savedUsers.length}`);
    console.log(`   Рецепты: ${savedRecipes.length}`);
    console.log(`   Продукты: ${savedProducts.length}`);
    console.log(`   Отзывы: ${savedReviews.length}`);
    console.log(`   Трекинг: ${savedTracking.length}`);
    console.log(`   Избранные: ${savedFavorites.length}`);

  } catch (error) {
    console.error('\n💥 Ошибка:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✓ Соединение с базой данных закрыто');
    }
  }
}

generateTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  });
