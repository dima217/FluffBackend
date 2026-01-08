# Безопасный метод загрузки файлов для рецептов

## Проблема предыдущего подхода

### Что было не так:

1. **Файлы загружались в S3 ДО создания рецепта**
   - Клиент получал presigned URLs
   - Загружал файлы напрямую в S3
   - Отмечал файлы как загруженные
   - Создавал рецепт с URL
   - **Проблема:** Если создание рецепта упадет - файлы остаются "висячими" в S3 без связи с рецептом

2. **Нет транзакционности**
   - Невозможно откатить загрузку файлов если создание рецепта не удалось
   - Файлы занимают место в S3 без пользы
   - Нет механизма очистки неиспользуемых файлов

3. **Нет гарантии связи файлов с рецептом**
   - Файлы могут быть загружены, но рецепт не создан
   - Нет способа проверить что файлы действительно используются

## Реализованное решение: Двухфазный безопасный подход

### Концепция

**Идея:** Создавать рецепт СНАЧАЛА с `mediaId` (идентификаторами файлов), а ПОТОМ обновлять его с реальными URL после успешной загрузки всех файлов.

### Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    ФАЗА 1: Подготовка                            │
├─────────────────────────────────────────────────────────────────┤
│ 1. POST /recipes/prepare-upload                                 │
│    → Получить presigned URLs для cover/preview                   │
│                                                                  │
│ 2. POST /recipes/prepare-step-resources-upload                  │
│    → Получить presigned URLs для ресурсов шагов                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ФАЗА 2: Загрузка файлов                       │
├─────────────────────────────────────────────────────────────────┤
│ 3. PUT <presigned-url> (напрямую в S3/MinIO)                   │
│    → Загрузить каждый файл используя presigned URL              │
│                                                                  │
│ 4. POST /recipes/mark-uploaded/:mediaId                         │
│    → Отметить каждый файл как загруженный                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ФАЗА 3: Создание рецепта                      │
├─────────────────────────────────────────────────────────────────┤
│ 5. POST /recipes/create-with-media-ids                          │
│    → Создать рецепт с mediaId (placeholder URLs)                │
│    → Рецепт создан, но НЕ финализирован                         │
│    → imageMediaIds хранит реальные mediaId                      │
│    → image содержит placeholder URLs (format: "media:mediaId")  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ФАЗА 4: Финализация                          │
├─────────────────────────────────────────────────────────────────┤
│ 6. POST /recipes/confirm-upload/:recipeId                       │
│    → Валидировать что все файлы загружены                       │
│    → Получить реальные URL из media service                     │
│    → Обновить рецепт с реальными URL                            │
│    → Очистить imageMediaIds (recipe финализирован)              │
└─────────────────────────────────────────────────────────────────┘
```

## Детальное описание каждого этапа

### Этап 1: Подготовка загрузки изображений

**Эндпоинт:** `POST /recipes/prepare-upload`

**Запрос:**

```json
{
  "coverFilename": "cover.jpg",
  "coverSize": 1024000,
  "previewFilename": "preview.jpg",
  "previewSize": 512000
}
```

**Ответ:**

```json
{
  "coverMediaId": "507f1f77bcf86cd799439011",
  "coverUploadUrl": "https://minio.example.com/bucket/user123/cover.jpg?X-Amz-Algorithm=...",
  "coverUrl": "/user123/cover.jpg",
  "previewMediaId": "507f1f77bcf86cd799439012",
  "previewUploadUrl": "https://minio.example.com/bucket/user123/preview.jpg?X-Amz-Algorithm=...",
  "previewUrl": "/user123/preview.jpg"
}
```

**Что происходит:**

1. Media Service создает две записи медиа (cover и preview) в своей БД
2. Генерирует presigned URLs для прямой загрузки в S3/MinIO
3. Возвращает `mediaId` (для связи) и `uploadUrl` (для загрузки)

**Важно:** На этом этапе файлы еще НЕ загружены, только созданы записи о них.

---

### Этап 2: Подготовка загрузки ресурсов шагов

**Эндпоинт:** `POST /recipes/prepare-step-resources-upload`

**Запрос:**

```json
{
  "resources": [
    {
      "filename": "step1-video.mp4",
      "size": 5242880,
      "type": "video",
      "position": 1
    },
    {
      "filename": "step2-image.jpg",
      "size": 1024000,
      "type": "image",
      "position": 2
    }
  ]
}
```

**Ответ:**

```json
{
  "resources": [
    {
      "mediaId": "507f1f77bcf86cd799439013",
      "uploadUrl": "https://minio.example.com/bucket/user123/step1-video.mp4?X-Amz-Algorithm=...",
      "url": "/user123/step1-video.mp4",
      "position": 1,
      "type": "video"
    },
    {
      "mediaId": "507f1f77bcf86cd799439014",
      "uploadUrl": "https://minio.example.com/bucket/user123/step2-image.jpg?X-Amz-Algorithm=...",
      "url": "/user123/step2-image.jpg",
      "position": 2,
      "type": "image"
    }
  ]
}
```

**Что происходит:**

1. Media Service создает записи медиа для каждого ресурса параллельно
2. Генерирует presigned URLs
3. Возвращает массив с `mediaId` и `uploadUrl` для каждого ресурса

---

### Этап 3: Загрузка файлов напрямую в S3/MinIO

**Действие:** Клиент загружает файлы напрямую в S3/MinIO используя presigned URLs

**Для каждого файла:**

```http
PUT https://minio.example.com/bucket/user123/cover.jpg?X-Amz-Algorithm=...
Content-Type: image/jpeg
Body: <binary file data>
```

**Что происходит:**

1. Файл загружается напрямую в S3/MinIO, минуя наш backend
2. Presigned URL имеет ограниченное время жизни (обычно 15-60 минут)
3. После успешной загрузки файл доступен по URL из ответа `prepare-upload`

**Преимущества:**

- Файлы не проходят через наш сервер (экономия ресурсов)
- Быстрая загрузка для клиента
- Масштабируемость (S3/MinIO обрабатывает нагрузку)

---

### Этап 4: Отметка файлов как загруженных

**Эндпоинт:** `POST /recipes/mark-uploaded/:mediaId`

**Для каждого файла:**

```http
POST /recipes/mark-uploaded/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Ответ:**

```json
{
  "success": true
}
```

**Что происходит:**

1. Backend вызывает Media Service: `POST /media/{mediaId}/loading-end`
2. Media Service обновляет статус файла как "загруженный" (`isLoaded: true`)
3. Теперь файл считается готовым к использованию

**Важно:** Этот шаг обязателен для каждого файла. Без него файл не будет считаться загруженным.

---

### Этап 5: Создание рецепта с mediaId

**Эндпоинт:** `POST /recipes/create-with-media-ids`

**Запрос:**

```json
{
  "name": "Delicious Pasta",
  "recipeTypeId": 1,
  "imageMediaIds": {
    "coverMediaId": "507f1f77bcf86cd799439011",
    "previewMediaId": "507f1f77bcf86cd799439012"
  },
  "productIds": [1, 2, 3],
  "calories": 500,
  "cookAt": 3600,
  "stepsConfig": {
    "steps": [
      {
        "name": "Step 1: Prepare ingredients",
        "description": "Chop vegetables",
        "resources": [
          {
            "position": 1,
            "mediaId": "507f1f77bcf86cd799439013",
            "type": "video"
          }
        ]
      }
    ]
  }
}
```

**Ответ:**

```json
{
  "id": 42,
  "name": "Delicious Pasta",
  "image": {
    "cover": "media:507f1f77bcf86cd799439011",
    "preview": "media:507f1f77bcf86cd799439012"
  },
  "stepsConfig": {
    "steps": [
      {
        "resources": [
          {
            "source": "media:507f1f77bcf86cd799439013",
            "type": "video"
          }
        ]
      }
    ]
  },
  ...
}
```

**Что происходит внутри:**

1. **Валидация данных:**
   - Проверка существования RecipeType
   - Проверка существования всех Products
   - Валидация структуры stepsConfig

2. **Создание рецепта с placeholder URLs:**

   ```typescript
   // RecipeMapper.toEntityWithMediaIds() создает:
   {
     image: {
       cover: "media:507f1f77bcf86cd799439011",  // Placeholder!
       preview: "media:507f1f77bcf86cd799439012" // Placeholder!
     },
     imageMediaIds: {
       coverMediaId: "507f1f77bcf86cd799439011",  // Реальный mediaId
       previewMediaId: "507f1f77bcf86cd799439012"  // Реальный mediaId
     },
     stepsConfig: {
       steps: [{
         resources: [{
           source: "media:507f1f77bcf86cd799439013", // Placeholder!
           type: "video"
         }]
       }]
     }
   }
   ```

3. **Сохранение в БД:**
   - Рецепт создается в PostgreSQL
   - `imageMediaIds` хранится в JSONB поле
   - `image` содержит placeholder URLs (формат: `"media:mediaId"`)
   - `stepsConfig` содержит placeholder URLs в `source`

**Состояние рецепта:**

- ✅ Рецепт создан в БД
- ✅ Связан с mediaId через `imageMediaIds`
- ⚠️ НЕ финализирован (placeholder URLs)
- ⚠️ Файлы могут быть еще не загружены

**Если что-то пойдет не так:**

- Рецепт можно удалить: `DELETE /recipes/:id`
- Media Service может почистить неиспользуемые файлы (по mediaId)
- Нет "висячих" файлов без связи с рецептом

---

### Этап 6: Финализация рецепта (подтверждение загрузки)

**Эндпоинт:** `POST /recipes/confirm-upload/:recipeId`

**Запрос:**

```json
{
  "recipeId": 42,
  "mediaIds": [
    "507f1f77bcf86cd799439011", // cover
    "507f1f77bcf86cd799439012", // preview
    "507f1f77bcf86cd799439013" // step resource
  ]
}
```

**Что происходит внутри:**

1. **Проверка рецепта:**

   ```typescript
   const recipe = await recipeRepository.findOne(recipeId);
   if (!recipe.imageMediaIds) {
     throw new BadRequestException('Recipe was not created with mediaIds');
   }
   ```

2. **Получение URL для всех mediaId:**

   ```typescript
   // Вызов Media Service: POST /media/get-urls
   const mediaUrls = await mediaService.getMediaUrls(confirmDto.mediaIds, token);
   // Возвращает:
   // [
   //   { mediaId: "507f1f77bcf86cd799439011", url: "/user123/cover.jpg", isLoaded: true },
   //   { mediaId: "507f1f77bcf86cd799439012", url: "/user123/preview.jpg", isLoaded: true },
   //   ...
   // ]
   ```

3. **Валидация загрузки:**

   ```typescript
   const notLoaded = mediaUrls.filter((m) => !m.isLoaded);
   if (notLoaded.length > 0) {
     throw new BadRequestException(
       `Some media files are not loaded: ${notLoaded.map((m) => m.mediaId).join(', ')}`,
     );
   }
   ```

   - Если хотя бы один файл не загружен - ошибка
   - Рецепт остается с mediaId, можно повторить позже

4. **Создание маппинга mediaId → URL:**

   ```typescript
   const mediaUrlMap = new Map(mediaUrls.map((m) => [m.mediaId, m.url]));
   // Map {
   //   "507f1f77bcf86cd799439011" => "/user123/cover.jpg",
   //   "507f1f77bcf86cd799439012" => "/user123/preview.jpg",
   //   ...
   // }
   ```

5. **Обновление изображений:**

   ```typescript
   const coverUrl = mediaUrlMap.get(recipe.imageMediaIds.coverMediaId);
   const previewUrl = mediaUrlMap.get(recipe.imageMediaIds.previewMediaId);

   if (!coverUrl || !previewUrl) {
     throw new BadRequestException('Cover or preview URL not found');
   }
   ```

6. **Обновление ресурсов шагов:**

   ```typescript
   const updatedStepsConfig = {
     steps: recipe.stepsConfig.steps.map((step) => ({
       ...step,
       resources: step.resources.map((resource) => {
         // Извлечь mediaId из placeholder URL: "media:507f1f77bcf86cd799439013"
         if (resource.source.startsWith('media:')) {
           const resourceMediaId = resource.source.substring(6);
           if (mediaUrlMap.has(resourceMediaId)) {
             return {
               ...resource,
               source: mediaUrlMap.get(resourceMediaId)!, // Реальный URL
             };
           }
         }
         return resource; // Если уже URL, оставить как есть
       }),
     })),
   };
   ```

7. **Обновление рецепта:**

   ```typescript
   const updateData: Partial<Recipe> = {
     image: {
       cover: coverUrl, // Реальный URL
       preview: previewUrl, // Реальный URL
     },
     imageMediaIds: null, // Очистить mediaId (рецепт финализирован)
     stepsConfig: updatedStepsConfig, // С реальными URL
   };

   return await recipeRepository.update(recipeId, updateData);
   ```

**Ответ:**

```json
{
  "id": 42,
  "name": "Delicious Pasta",
  "image": {
    "cover": "/user123/cover.jpg",      // Реальный URL!
    "preview": "/user123/preview.jpg"   // Реальный URL!
  },
  "stepsConfig": {
    "steps": [
      {
        "resources": [
          {
            "source": "/user123/step1-video.mp4", // Реальный URL!
            "type": "video"
          }
        ]
      }
    ]
  },
  ...
}
```

**Состояние рецепта после финализации:**

- ✅ Рецепт финализирован
- ✅ Все URL реальные (не placeholder)
- ✅ `imageMediaIds` = null (больше не нужен)
- ✅ Готов к использованию

---

## Преимущества этого подхода

### 1. Транзакционность

- Рецепт создается ДО загрузки файлов
- Файлы связаны с рецептом через mediaId
- Если загрузка не удалась - рецепт можно удалить
- Нет "висячих" файлов без связи

### 2. Безопасность

- Все файлы валидируются перед финализацией
- Проверка что все файлы загружены (`isLoaded: true`)
- Невозможно финализировать рецепт с незагруженными файлами

### 3. Откат (Rollback)

- Если загрузка не удалась - рецепт остается с mediaId
- Можно повторить `confirm-upload` позже
- Или удалить рецепт: `DELETE /recipes/:id`
- Media Service может почистить неиспользуемые файлы

### 4. Производительность

- Файлы загружаются напрямую в S3/MinIO (минуя backend)
- Backend не обрабатывает большие файлы
- Масштабируемость

### 5. Надежность

- Если S3 упадет после загрузки - рецепт не финализируется
- Если `confirm-upload` упадет - рецепт остается с mediaId
- Можно повторить операцию

---

## Обработка ошибок

### Сценарий 1: Файл не загружен

**Что происходит:**

```typescript
// confirmUpload() проверяет:
const notLoaded = mediaUrls.filter((m) => !m.isLoaded);
if (notLoaded.length > 0) {
  throw new BadRequestException('Some media files are not loaded');
}
```

**Результат:**

- Рецепт остается с `imageMediaIds`
- Можно повторить загрузку файла
- Затем повторить `confirm-upload`

### Сценарий 2: MediaId не найден

**Что происходит:**

```typescript
const coverUrl = mediaUrlMap.get(recipe.imageMediaIds.coverMediaId);
if (!coverUrl) {
  throw new BadRequestException('Cover or preview URL not found');
}
```

**Результат:**

- Ошибка валидации
- Рецепт остается с mediaId
- Нужно проверить что все mediaId правильные

### Сценарий 3: Рецепт не создан с mediaId

**Что происходит:**

```typescript
if (!recipe.imageMediaIds) {
  throw new BadRequestException('Recipe was not created with mediaIds');
}
```

**Результат:**

- Ошибка - рецепт был создан старым методом (с URL)
- Нужно использовать `create-with-media-ids`

---

## Структура данных в БД

### До финализации (с mediaId):

```json
{
  "id": 42,
  "name": "Delicious Pasta",
  "image": {
    "cover": "media:507f1f77bcf86cd799439011",
    "preview": "media:507f1f77bcf86cd799439012"
  },
  "imageMediaIds": {
    "coverMediaId": "507f1f77bcf86cd799439011",
    "previewMediaId": "507f1f77bcf86cd799439012"
  },
  "stepsConfig": {
    "steps": [
      {
        "resources": [
          {
            "source": "media:507f1f77bcf86cd799439013",
            "type": "video"
          }
        ]
      }
    ]
  }
}
```

### После финализации (с URL):

```json
{
  "id": 42,
  "name": "Delicious Pasta",
  "image": {
    "cover": "/user123/cover.jpg",
    "preview": "/user123/preview.jpg"
  },
  "imageMediaIds": null,
  "stepsConfig": {
    "steps": [
      {
        "resources": [
          {
            "source": "/user123/step1-video.mp4",
            "type": "video"
          }
        ]
      }
    ]
  }
}
```

---

## Полный пример workflow

### Шаг 1: Подготовка

```bash
# Получить presigned URLs для изображений
POST /recipes/prepare-upload
→ coverMediaId: "media-001", previewMediaId: "media-002"

# Получить presigned URLs для ресурсов шагов
POST /recipes/prepare-step-resources-upload
→ resources: [{ mediaId: "media-003", position: 1, ... }]
```

### Шаг 2: Загрузка файлов

```bash
# Загрузить cover
PUT <coverUploadUrl> → файл в S3

# Загрузить preview
PUT <previewUploadUrl> → файл в S3

# Загрузить step resource
PUT <resourceUploadUrl> → файл в S3

# Отметить все как загруженные
POST /recipes/mark-uploaded/media-001
POST /recipes/mark-uploaded/media-002
POST /recipes/mark-uploaded/media-003
```

### Шаг 3: Создание рецепта

```bash
POST /recipes/create-with-media-ids
{
  "name": "Pasta",
  "imageMediaIds": {
    "coverMediaId": "media-001",
    "previewMediaId": "media-002"
  },
  "stepsConfig": {
    "steps": [{
      "resources": [{
        "mediaId": "media-003",
        "type": "video"
      }]
    }]
  }
}
→ recipeId: 42 (создан, но не финализирован)
```

### Шаг 4: Финализация

```bash
POST /recipes/confirm-upload/42
{
  "recipeId": 42,
  "mediaIds": ["media-001", "media-002", "media-003"]
}
→ Рецепт финализирован с реальными URL
```

---

## Сравнение с предыдущим подходом

| Аспект               | Старый подход    | Новый подход                   |
| -------------------- | ---------------- | ------------------------------ |
| **Порядок операций** | Файлы → Рецепт   | Рецепт → Файлы → Финализация   |
| **Связь файлов**     | Только через URL | Через mediaId + URL            |
| **Транзакционность** | ❌ Нет           | ✅ Есть                        |
| **Откат**            | ❌ Невозможен    | ✅ Возможен                    |
| **Валидация**        | ❌ Нет           | ✅ Проверка перед финализацией |
| **"Висячие" файлы**  | ⚠️ Возможны      | ✅ Невозможны                  |
| **Безопасность**     | ⚠️ Средняя       | ✅ Высокая                     |

---

## Заключение

Реализованный подход обеспечивает:

1. **Безопасность** - файлы всегда связаны с рецептом через mediaId
2. **Транзакционность** - можно откатить если что-то пошло не так
3. **Валидацию** - проверка что все файлы загружены перед финализацией
4. **Надежность** - нет "висячих" файлов в S3
5. **Производительность** - файлы загружаются напрямую в S3

Этот метод является **рекомендуемым** для всех новых интеграций, требующих загрузки файлов.
