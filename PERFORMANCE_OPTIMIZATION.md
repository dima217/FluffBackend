# Оптимизация производительности загрузки файлов

## Текущее состояние

✅ **Все проблемы производительности решены!**

Старый метод multipart загрузки удален. Теперь используется только оптимизированный подход с Presigned URLs:

- ✅ Файлы загружаются напрямую в S3/MinIO, минуя наш сервер
- ✅ Нет двойной загрузки
- ✅ Нет проблем с памятью сервера
- ✅ Параллельная обработка запросов на создание медиа-записей

## Рекомендуемые оптимизации

### Вариант 1: Использование Presigned URLs (РЕКОМЕНДУЕТСЯ)

Медиа-сервис уже возвращает `uploadUrl` (presigned URL) в ответе `createMedia`.
Можно использовать его для прямой загрузки от клиента в S3/MinIO, минуя наш сервер.

**Архитектура:**

1. Клиент отправляет запрос на создание рецепта (без файлов)
2. Сервер создает записи медиа и возвращает presigned URLs
3. Клиент загружает файлы напрямую в S3/MinIO используя presigned URLs
4. Клиент отправляет запрос на завершение создания рецепта с URL изображений

**Преимущества:**

- Файлы не проходят через наш сервер
- Меньше нагрузка на сервер
- Быстрее загрузка для клиента
- Масштабируемость

**Недостатки:**

- Требует изменения API (два запроса вместо одного)
- Клиент должен поддерживать прямую загрузку в S3

### Вариант 2: Объединение запросов

Создать batch endpoint в медиа-сервисе для создания нескольких записей за один запрос.

### Вариант 3: Асинхронная обработка

Обрабатывать загрузку файлов в фоне через очередь (например, Bull/BullMQ).

## Текущие оптимизации

✅ **Presigned URLs реализован** - эндпоинт POST /recipes/prepare-upload для получения presigned URLs
✅ **Параллельная обработка файлов** - cover и preview загружаются параллельно
✅ **Увеличенный timeout** - 60 секунд для больших файлов
✅ **Логирование размера файлов** - для мониторинга

## Метрики производительности

Для оценки производительности рекомендуется отслеживать:

- Время загрузки файла (от клиента до S3)
- Использование памяти сервера
- Пропускная способность сети
- Время ответа API

## Рекомендации

1. ✅ **Реализовано**: Presigned URLs для прямой загрузки
2. ✅ **Удалено**: Старый метод multipart загрузки (больше не используется)
3. **Среднесрочно**: Мигрировать клиентов на использование presigned URLs
4. **Долгосрочно**: Добавить очередь для асинхронной обработки больших файлов

## Пример использования Presigned URLs

### Шаг 1: Получить presigned URLs

```typescript
POST /recipes/prepare-upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverFilename": "cover.jpg",
  "coverSize": 1024000,
  "previewFilename": "preview.jpg",
  "previewSize": 512000
}

// Response:
{
  "coverMediaId": "507f1f77bcf86cd799439011",
  "coverUploadUrl": "https://minio.example.com/bucket/user123/cover.jpg?X-Amz-Algorithm=...",
  "coverUrl": "/user123/cover.jpg",
  "previewMediaId": "507f1f77bcf86cd799439012",
  "previewUploadUrl": "https://minio.example.com/bucket/user123/preview.jpg?X-Amz-Algorithm=...",
  "previewUrl": "/user123/preview.jpg"
}
```

### Шаг 2: Загрузить файлы напрямую в S3/MinIO

```typescript
// Загрузка cover
PUT <coverUploadUrl>
Content-Type: image/jpeg
Body: <file binary data>

// Загрузка preview
PUT <previewUploadUrl>
Content-Type: image/jpeg
Body: <file binary data>
```

### Шаг 3: Отметить файлы как загруженные

```typescript
POST /recipes/mark-uploaded/507f1f77bcf86cd799439011
Authorization: Bearer <token>

POST /recipes/mark-uploaded/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

### Шаг 4: Создать рецепт с URL изображений

```typescript
POST /recipes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Delicious Pasta",
  "recipeTypeId": 1,
  "image": {
    "cover": "/user123/cover.jpg",
    "preview": "/user123/preview.jpg"
  },
  "productIds": [1, 2, 3],
  "calories": 500,
  "cookAt": 3600,
  "stepsConfig": {
    "steps": []
  }
}
```

## Преимущества реализованного решения

- ✅ Файлы не проходят через наш сервер
- ✅ Меньше нагрузка на сервер
- ✅ Быстрее загрузка для клиента
- ✅ Масштабируемость
- ✅ Поддержка больших файлов без ограничений памяти сервера
