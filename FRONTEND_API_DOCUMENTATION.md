# Frontend API Documentation

Полная документация API для фронтенд разработки приложения Fluff (калорийный трекер).

## Содержание

1. [Базовые настройки](#базовые-настройки)
2. [Аутентификация](#аутентификация)
3. [Пользователи и профили](#пользователи-и-профили)
4. [Рецепты](#рецепты)
5. [Продукты](#продукты)
6. [Трекинг калорий](#трекинг-калорий)
7. [Избранное](#избранное)
8. [OAuth](#oauth)
9. [Загрузка файлов](#загрузка-файлов)
10. [Обработка ошибок](#обработка-ошибок)
11. [Примеры кода](#примеры-кода)

---

## Базовые настройки

### Базовый URL

```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

### Получение Swagger JSON

Для генерации клиентского кода используйте скрипт:

```bash
# Получить Swagger JSON
npm run swagger:fetch

# С красивым форматированием
npm run swagger:fetch:pretty

# С кастомными параметрами
node scripts/fetch-swagger.js --url http://localhost:3000 --output swagger.json --pretty
```

Swagger JSON будет доступен по адресу: `http://localhost:3000/api-json`

### Заголовки запросов

Все запросы должны включать:

```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <access_token>' // Для защищенных эндпоинтов
}
```

### Формат ответов

Все успешные ответы возвращают данные в формате JSON. Ошибки возвращаются в следующем формате:

```typescript
{
  statusCode: number,
  message: string | string[],
  error?: string
}
```

---

## Аутентификация

### Регистрация (двухэтапная)

#### 1. Инициализация регистрации

**POST** `/user/sign-up-init`

Отправляет код подтверждения на email.

```typescript
// Request
{
  email: string
}

// Response 200
{
  message: "Verification code sent to your email"
}
```

#### 2. Завершение регистрации

**POST** `/user/sign-up`

Регистрирует пользователя с кодом подтверждения. **Важно:** Для трекинга калорий требуются поля `gender`, `birthDate`, `height`, `weight`.

```typescript
// Request
{
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  code: string,
  gender: 'male' | 'female' | 'other',
  birthDate: string, // ISO 8601 format: "1990-01-01T00:00:00.000Z"
  height: number, // в сантиметрах (50-300)
  weight: number // в килограммах (20-500)
}

// Response 201
{
  accessToken: string,
  refreshToken: string
}
```

**Cookies:** `refreshToken` также устанавливается в HTTP-only cookie.

### Вход

**POST** `/user/login`

```typescript
// Request
{
  email: string,
  password: string
}

// Response 200
{
  accessToken: string,
  refreshToken: string
}
```

**Cookies:** `refreshToken` устанавливается в HTTP-only cookie.

### Обновление токена

**POST** `/user/refresh`

Обновляет access token используя refresh token из cookie.

```typescript
// Request (без body, refreshToken из cookie)

// Response 200
{
  accessToken: string,
  refreshToken: string
}
```

### Выход

**POST** `/user/logout`

```typescript
// Response 200
{
  message: "Logged out successfully"
}
```

### Восстановление пароля

#### 1. Инициализация восстановления

**POST** `/user/recovery-init`

```typescript
// Request
{
  email: string
}

// Response 200
{
  message: "Recovery code sent to your email"
}
```

#### 2. Подтверждение восстановления

**POST** `/user/recovery-confirm`

```typescript
// Request
{
  email: string,
  code: string,
  newPassword: string
}

// Response 200
{
  message: "Password recovered successfully"
}
```

---

## Пользователи и профили

### Получение профиля

**GET** `/profile`

```typescript
// Response 200
{
  id: string,
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string
  },
  birthDate: string, // ISO 8601
  bio: string | null,
  photo: string | null,
  gender: 'male' | 'female' | 'other' | null,
  height: number | null, // в сантиметрах
  weight: number | null, // в килограммах
  createdAt: string,
  updatedAt: string
}
```

### Обновление профиля

**PUT** `/profile`

```typescript
// Request (все поля опциональны)
{
  firstName?: string,
  lastName?: string,
  birthDate?: string, // ISO 8601
  bio?: string,
  photo?: string,
  gender?: 'male' | 'female' | 'other',
  height?: number, // 50-300
  weight?: number // 20-500
}

// Response 200
// ProfileResponseDto (см. выше)
```

---

## Рецепты

### Получение всех рецептов

**GET** `/recipes`

```typescript
// Query parameters (опционально)
{
  page?: number,
  limit?: number
}

// Response 200
RecipeResponseDto[]
```

### Получение рецепта по ID

**GET** `/recipes/:id`

```typescript
// Response 200
{
  id: number,
  user: {
    id: number,
    firstName: string,
    lastName: string
  } | null,
  name: string,
  type: {
    id: number,
    name: string
  },
  average: number,
  favorite: boolean,
  image: {
    cover: string,
    preview: string
  },
  promotionalVideo: string | null,
  description: string | null,
  products: number[],
  fluffAt: string | null,
  calories: number,
  cookAt: number,
  stepsConfig: {
    steps: Array<{
      name: string,
      description: string,
      resources: Array<{
        position: number,
        source: string,
        type: string
      }>
    }>
  },
  createdAt: string,
  updatedAt: string
}
```

### Создание рецепта (безопасная загрузка файлов)

#### Метод 1: С прямыми URL (для внешних изображений)

**POST** `/recipes`

```typescript
// Request
{
  name: string,
  recipeTypeId: number,
  image: {
    cover: string, // URL изображения
    preview: string // URL изображения
  },
  promotionalVideo?: string, // URL видео (опционально)
  description?: string,
  productIds: number[],
  fluffAt?: string, // ISO 8601
  calories: number,
  cookAt: number, // в секундах
  stepsConfig: {
    steps: Array<{
      name: string,
      description: string,
      resources: Array<{
        position: number,
        source: string, // URL ресурса
        type: string // 'video' | 'image'
      }>
    }>
  }
}

// Response 201
RecipeResponseDto
```

#### Метод 2: Безопасная двухфазная загрузка (рекомендуется)

**Шаг 1:** Подготовка загрузки изображений рецепта

**POST** `/recipes/prepare-upload`

```typescript
// Request
{
  coverFilename: string,
  coverSize: number, // в байтах
  previewFilename: string,
  previewSize: number // в байтах
}

// Response 200
{
  coverMediaId: string,
  coverUploadUrl: string, // Presigned URL для загрузки
  coverUrl: string,
  previewMediaId: string,
  previewUploadUrl: string, // Presigned URL для загрузки
  previewUrl: string
}
```

**Шаг 2:** Подготовка загрузки промо-видео (опционально)

**POST** `/recipes/prepare-video-upload`

```typescript
// Request
{
  filename: string,
  size: number // в байтах
}

// Response 200
{
  mediaId: string,
  uploadUrl: string, // Presigned URL для загрузки
  url: string
}
```

**Шаг 3:** Подготовка загрузки ресурсов шагов

**POST** `/recipes/prepare-step-resources-upload`

```typescript
// Request
{
  resources: Array<{
    filename: string,
    size: number, // в байтах
    type: string, // 'video' | 'image'
    position: number
  }>
}

// Response 200
{
  resources: Array<{
    mediaId: string,
    uploadUrl: string, // Presigned URL для загрузки
    url: string,
    position: number,
    type: string
  }>
}
```

**Шаг 4:** Загрузка файлов напрямую в S3/MinIO

Для каждого файла выполните PUT запрос на `uploadUrl`:

```typescript
// PUT <uploadUrl>
// Headers:
{
  'Content-Type': '<mime-type>',
  'Content-Length': '<file-size>'
}
// Body: <binary file data>
```

**Шаг 5:** Отметка файлов как загруженных

**POST** `/recipes/mark-uploaded/:mediaId`

Вызовите для каждого успешно загруженного файла.

```typescript
// Response 200
{
  success: true
}
```

**Шаг 6:** Создание рецепта с mediaId

**POST** `/recipes/create-with-media-ids`

```typescript
// Request
{
  name: string,
  recipeTypeId: number,
  imageMediaIds: {
    coverMediaId: string,
    previewMediaId: string
  },
  promotionalVideoMediaId?: string, // если загружали видео
  description?: string,
  productIds: number[],
  fluffAt?: string, // ISO 8601
  calories: number,
  cookAt: number,
  stepsConfig: {
    steps: Array<{
      name: string,
      description: string,
      resources: Array<{
        position: number,
        mediaId: string, // из prepare-step-resources-upload
        type: string
      }>
    }>
  }
}

// Response 201
RecipeResponseDto // с placeholder URLs (media:mediaId)
```

**Шаг 7:** Финализация рецепта

**POST** `/recipes/confirm-upload/:recipeId`

```typescript
// Request
{
  recipeId: number,
  mediaIds: string[] // все mediaId (cover, preview, video, step resources)
}

// Response 200
RecipeResponseDto // с реальными URL
```

### Обновление рецепта

**PUT** `/recipes/:id`

```typescript
// Request (все поля опциональны)
{
  name?: string,
  recipeTypeId?: number,
  image?: {
    cover: string,
    preview: string
  },
  promotionalVideo?: string | null,
  description?: string | null,
  productIds?: number[],
  fluffAt?: string | null,
  calories?: number,
  cookAt?: number,
  stepsConfig?: {
    steps: Array<{
      name: string,
      description: string,
      resources: Array<{
        position: number,
        source: string,
        type: string
      }>
    }>
  }
}

// Response 200
RecipeResponseDto
```

### Удаление рецепта

**DELETE** `/recipes/:id`

```typescript
// Response 204 (No Content)
```

### Получение избранных рецептов

**GET** `/recipes/favorites`

```typescript
// Response 200
RecipeResponseDto[]
```

---

## Продукты

### Получение всех продуктов

**GET** `/products`

```typescript
// Response 200
ProductResponseDto[]
```

### Получение продукта по ID

**GET** `/products/:id`

```typescript
// Response 200
{
  id: number,
  name: string,
  calories: number, // на 100г
  massa: number, // в граммах
  image: {
    cover: string,
    preview: string
  } | null,
  countFavorites: number,
  favorite: boolean,
  fluffAt: string | null,
  createdAt: string
}
```

### Создание продукта

#### Метод 1: С прямыми URL

**POST** `/products`

```typescript
// Request
{
  name: string,
  calories: number, // на 100г
  massa: number, // в граммах
  image?: {
    cover: string,
    preview: string
  },
  fluffAt?: string // ISO 8601
}

// Response 201
ProductResponseDto
```

#### Метод 2: Безопасная двухфазная загрузка

**Шаг 1:** Подготовка загрузки

**POST** `/products/prepare-upload`

```typescript
// Request
{
  coverFilename: string,
  coverSize: number,
  previewFilename: string,
  previewSize: number
}

// Response 200
{
  coverMediaId: string,
  coverUploadUrl: string,
  coverUrl: string,
  previewMediaId: string,
  previewUploadUrl: string,
  previewUrl: string
}
```

**Шаг 2-4:** Загрузка файлов и отметка (аналогично рецептам)

**Шаг 5:** Создание продукта с mediaId

**POST** `/products/create-with-media-ids`

```typescript
// Request
{
  name: string,
  calories: number,
  massa: number,
  imageMediaIds: {
    coverMediaId: string,
    previewMediaId: string
  },
  fluffAt?: string
}

// Response 201
ProductResponseDto
```

**Шаг 6:** Финализация продукта

**POST** `/products/confirm-upload/:productId`

```typescript
// Request
{
  productId: number,
  mediaIds: string[] // [coverMediaId, previewMediaId]
}

// Response 200
ProductResponseDto
```

### Обновление продукта

**PUT** `/products/:id`

```typescript
// Request (все поля опциональны)
{
  name?: string,
  calories?: number,
  massa?: number,
  image?: {
    cover: string,
    preview: string
  } | null,
  fluffAt?: string | null
}

// Response 200
ProductResponseDto
```

### Удаление продукта

**DELETE** `/products/:id`

```typescript
// Response 204 (No Content)
```

### Получение избранных продуктов

**GET** `/products/favorites`

```typescript
// Response 200
ProductResponseDto[]
```

---

## Трекинг калорий

### Создание записи трекинга

**POST** `/tracking`

```typescript
// Request
{
  date: string, // ISO 8601 format: "2024-01-01T00:00:00.000Z"
  calories: number
}

// Response 201
{
  id: number,
  userId: number,
  date: string,
  calories: number,
  createdAt: string,
  updatedAt: string
}
```

### Получение всех записей трекинга

**GET** `/tracking`

```typescript
// Query parameters (опционально)
{
  startDate?: string, // ISO 8601
  endDate?: string // ISO 8601
}

// Response 200
TrackingResponseDto[]
```

### Получение записи по ID

**GET** `/tracking/:id`

```typescript
// Response 200
TrackingResponseDto
```

### Получение статистики за день

**GET** `/tracking/statistics/day`

```typescript
// Query parameters
{
  date: string // ISO 8601 format: "2024-01-01T00:00:00.000Z"
}

// Response 200
{
  date: string,
  totalCalories: number,
  records: TrackingResponseDto[]
}
```

### Обновление записи трекинга

**PUT** `/tracking/:id`

```typescript
// Request
{
  date?: string, // ISO 8601
  calories?: number
}

// Response 200
TrackingResponseDto
```

### Удаление записи трекинга

**DELETE** `/tracking/:id`

```typescript
// Response 204 (No Content)
```

---

## Избранное

### Добавление в избранное

**POST** `/favorites/:type/:id`

```typescript
// Path parameters
{
  type: 'recipe' | 'product',
  id: number
}

// Response 201
{
  message: "Added to favorites successfully"
}
```

### Удаление из избранного

**DELETE** `/favorites/:type/:id`

```typescript
// Path parameters
{
  type: 'recipe' | 'product',
  id: number
}

// Response 204 (No Content)
```

### Проверка статуса избранного

**GET** `/favorites/:type/:id`

```typescript
// Path parameters
{
  type: 'recipe' | 'product',
  id: number
}

// Response 200
{
  isFavorite: boolean
}
```

---

## OAuth

### OAuth вход (Google)

**POST** `/oauth/login`

```typescript
// Request
{
  token: string, // OAuth token от провайдера
  type: 'google'
}

// Response 200
{
  accessToken: string,
  refreshToken: string
}
```

**Cookies:** `refreshToken` устанавливается в HTTP-only cookie.

---

## Загрузка файлов

### Общий workflow для безопасной загрузки

1. **Подготовка:** Вызовите `prepare-upload` эндпоинт для получения presigned URLs
2. **Загрузка:** Загрузите файлы напрямую в S3/MinIO используя presigned URLs (PUT запрос)
3. **Отметка:** Вызовите `mark-uploaded/:mediaId` для каждого файла
4. **Создание:** Создайте сущность (рецепт/продукт) с `mediaId`
5. **Финализация:** Вызовите `confirm-upload/:id` для получения реальных URL

### Пример загрузки файла

```typescript
async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size.toString()
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}
```

### Важные замечания

- Presigned URLs имеют ограниченное время жизни (обычно 15-60 минут)
- Файлы загружаются напрямую в S3/MinIO, минуя backend
- После успешной загрузки обязательно вызовите `mark-uploaded`
- Рецепт/продукт создается с placeholder URLs (`media:mediaId`)
- После финализации placeholder URLs заменяются на реальные

---

## Обработка ошибок

### Коды статусов

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс создан
- **204 No Content** - Успешное удаление
- **400 Bad Request** - Неверные данные запроса
- **401 Unauthorized** - Требуется аутентификация
- **403 Forbidden** - Доступ запрещен
- **404 Not Found** - Ресурс не найден
- **409 Conflict** - Конфликт (например, email уже существует)
- **500 Internal Server Error** - Ошибка сервера

### Формат ошибок

```typescript
{
  statusCode: number,
  message: string | string[], // Может быть массивом для валидационных ошибок
  error?: string
}
```

### Пример обработки ошибок

```typescript
try {
  const response = await fetch('/api/recipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(recipeData)
  });

  if (!response.ok) {
    const error = await response.json();
    if (Array.isArray(error.message)) {
      // Валидационные ошибки
      error.message.forEach(msg => console.error(msg));
    } else {
      console.error(error.message);
    }
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('Request failed:', error);
  throw error;
}
```

---

## Примеры кода

### TypeScript/JavaScript клиент

```typescript
// api-client.ts
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Аутентификация
  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; refreshToken: string }>(
      '/user/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.setAccessToken(data.accessToken);
    return data;
  }

  // Рецепты
  async getRecipes() {
    return this.request<RecipeResponseDto[]>('/recipes');
  }

  async createRecipe(recipe: CreateRecipeDto) {
    return this.request<RecipeResponseDto>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  // Безопасная загрузка рецепта
  async createRecipeWithFiles(recipeData: {
    name: string;
    recipeTypeId: number;
    coverFile: File;
    previewFile: File;
    // ... другие поля
  }) {
    // 1. Подготовка
    const prepareResponse = await this.request<PrepareUploadResponseDto>(
      '/recipes/prepare-upload',
      {
        method: 'POST',
        body: JSON.stringify({
          coverFilename: recipeData.coverFile.name,
          coverSize: recipeData.coverFile.size,
          previewFilename: recipeData.previewFile.name,
          previewSize: recipeData.previewFile.size,
        }),
      }
    );

    // 2. Загрузка файлов
    await this.uploadFile(prepareResponse.coverUploadUrl, recipeData.coverFile);
    await this.uploadFile(prepareResponse.previewUploadUrl, recipeData.previewFile);

    // 3. Отметка загрузки
    await this.request('/recipes/mark-uploaded/' + prepareResponse.coverMediaId, {
      method: 'POST',
    });
    await this.request('/recipes/mark-uploaded/' + prepareResponse.previewMediaId, {
      method: 'POST',
    });

    // 4. Создание рецепта
    const recipe = await this.request<RecipeResponseDto>(
      '/recipes/create-with-media-ids',
      {
        method: 'POST',
        body: JSON.stringify({
          name: recipeData.name,
          recipeTypeId: recipeData.recipeTypeId,
          imageMediaIds: {
            coverMediaId: prepareResponse.coverMediaId,
            previewMediaId: prepareResponse.previewMediaId,
          },
          // ... другие поля
        }),
      }
    );

    // 5. Финализация
    return this.request<RecipeResponseDto>(
      `/recipes/confirm-upload/${recipe.id}`,
      {
        method: 'POST',
        body: JSON.stringify({
          recipeId: recipe.id,
          mediaIds: [
            prepareResponse.coverMediaId,
            prepareResponse.previewMediaId,
          ],
        }),
      }
    );
  }

  private async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }
  }
}

// Использование
const api = new ApiClient('http://localhost:3000');
await api.login('user@example.com', 'password');
const recipes = await api.getRecipes();
```

### React Hook пример

```typescript
// useApi.ts
import { useState, useEffect } from 'react';

export function useApi<T>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Request failed');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Использование
function RecipesList() {
  const { data: recipes, loading, error } = useApi<RecipeResponseDto[]>('/recipes');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {recipes?.map(recipe => (
        <li key={recipe.id}>{recipe.name}</li>
      ))}
    </ul>
  );
}
```

---

## Типы данных

### RecipeResponseDto

```typescript
interface RecipeResponseDto {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  name: string;
  type: {
    id: number;
    name: string;
  };
  average: number;
  favorite: boolean;
  image: {
    cover: string;
    preview: string;
  };
  promotionalVideo: string | null;
  description: string | null;
  products: number[];
  fluffAt: string | null;
  calories: number;
  cookAt: number;
  stepsConfig: {
    steps: Array<{
      name: string;
      description: string;
      resources: Array<{
        position: number;
        source: string;
        type: string;
      }>;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}
```

### ProductResponseDto

```typescript
interface ProductResponseDto {
  id: number;
  name: string;
  calories: number;
  massa: number;
  image: {
    cover: string;
    preview: string;
  } | null;
  countFavorites: number;
  favorite: boolean;
  fluffAt: string | null;
  createdAt: string;
}
```

### TrackingResponseDto

```typescript
interface TrackingResponseDto {
  id: number;
  userId: number;
  date: string;
  calories: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Дополнительные ресурсы

- **Swagger UI:** `http://localhost:3000/api` - Интерактивная документация API
- **Swagger JSON:** `http://localhost:3000/api-json` - OpenAPI спецификация в JSON
- **Безопасная загрузка файлов:** См. `SAFE_UPLOAD_APPROACH.md` для детального описания workflow

---

## Поддержка

При возникновении проблем:
1. Проверьте, что backend запущен и доступен
2. Убедитесь, что используете правильный базовый URL
3. Проверьте валидность access token
4. Проверьте формат данных запроса
5. Изучите Swagger UI для актуальной документации

