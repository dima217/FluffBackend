# Архитектура получения медиа-файлов

## Проблема

Когда изображение находится в S3/MinIO и мы получили URL для скачивания (не прямую HTTP ссылку), возникает вопрос: кто должен обрабатывать запрос на получение изображения?

## Варианты решения

### Вариант 1: Фронтенд напрямую обращается к медиа-микросервису

**Архитектура:**

```
Frontend → Media Service → S3/MinIO
```

**Плюсы:**

- ✅ Меньше нагрузка на основной бэкенд
- ✅ Прямая связь, меньше задержек
- ✅ Медиа-микросервис может кэшировать запросы
- ✅ Медиа-микросервис может оптимизировать доставку (CDN, сжатие, ресайз)

**Минусы:**

- ❌ Фронтенд должен знать о существовании медиа-микросервиса
- ❌ Нужна аутентификация на фронтенде для медиа-микросервиса
- ❌ Усложнение фронтенда (нужно обрабатывать два разных API)
- ❌ CORS настройки на медиа-микросервисе

**Реализация:**

- URL в ответе: `http://media-service:3001/media/{mediaId}` или `https://media.example.com/media/{mediaId}`
- Фронтенд делает запрос: `GET /media/{mediaId}` с JWT токеном

---

### Вариант 2: Бэкенд проксирует запросы (РЕКОМЕНДУЕТСЯ)

**Архитектура:**

```
Frontend → Backend → Media Service → S3/MinIO
```

**Плюсы:**

- ✅ Единая точка входа для фронтенда
- ✅ Фронтенд не знает о медиа-микросервисе (инкапсуляция)
- ✅ Проще управление доступом (централизованная авторизация)
- ✅ Легче добавить кэширование на уровне бэкенда
- ✅ Можно добавить логирование, метрики
- ✅ Проще тестирование (один endpoint для фронтенда)

**Минусы:**

- ❌ Дополнительная нагрузка на бэкенд (но минимальная для проксирования)
- ❌ Дополнительный хоп в сети

**Реализация:**

- URL в ответе: `http://backend:3000/api/media/{mediaId}` или относительный `/api/media/{mediaId}`
- Фронтенд делает запрос: `GET /api/media/{mediaId}` с JWT токеном
- Бэкенд проксирует запрос к медиа-микросервису

---

### Вариант 3: Прямые S3/MinIO URLs (presigned URLs)

**Архитектура:**

```
Frontend → S3/MinIO (напрямую)
```

**Плюсы:**

- ✅ Максимальная производительность
- ✅ Нет нагрузки на бэкенд и медиа-микросервис
- ✅ Можно использовать CDN

**Минусы:**

- ❌ Нужно управлять временем жизни URL (TTL)
- ❌ Безопасность (presigned URLs могут быть скомпрометированы)
- ❌ Сложнее контролировать доступ
- ❌ Нужно обновлять URL при истечении срока

**Реализация:**

- URL в ответе: `https://s3.example.com/bucket/path/file.jpg?X-Amz-Algorithm=...`
- Фронтенд использует URL напрямую в `<img src="...">`

---

## Рекомендация: Вариант 2 (Бэкенд проксирует)

### Почему?

1. **Инкапсуляция**: Фронтенд не должен знать о внутренней архитектуре
2. **Гибкость**: Легко изменить медиа-микросервис без изменений на фронтенде
3. **Безопасность**: Централизованное управление доступом
4. **Простота**: Фронтенд работает только с одним API

### Реализация

#### 1. Добавить endpoint для проксирования медиа

```typescript
// src/infrastructure/routers/api/media.controller.ts
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':mediaId')
  @ApiOperation({ summary: 'Get media file (proxy to media service)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'mediaId', type: String })
  @ApiResponse({ status: 200, description: 'Media file' })
  async getMedia(
    @Param('mediaId') mediaId: string,
    @Token() token: string,
    @Res() res: Response,
  ): Promise<void> {
    // Проксируем запрос к медиа-микросервису
    const mediaUrl = await this.mediaService.getMediaUrl(mediaId, token);

    // Перенаправляем или проксируем файл
    res.redirect(mediaUrl);
    // ИЛИ
    // const fileStream = await this.mediaService.getMediaStream(mediaId, token);
    // fileStream.pipe(res);
  }
}
```

#### 2. Изменить URL в ответах

Вместо прямого URL к медиа-микросервису, возвращать URL к бэкенду:

```typescript
// В confirmUpload и других методах
const mediaUrl = `${backendBaseUrl}/api/media/${mediaId}`;
```

#### 3. Альтернатива: Относительные URL

Если фронтенд и бэкенд на одном домене:

```typescript
const mediaUrl = `/api/media/${mediaId}`;
```

---

## Гибридный подход (опционально)

Можно комбинировать варианты:

1. **Для публичных изображений**: Прямые S3 URLs (presigned с долгим TTL)
2. **Для приватных изображений**: Прокси через бэкенд
3. **Для больших файлов**: Прямые S3 URLs (меньше нагрузка)

Определить тип можно по метаданным медиа или по настройкам:

```typescript
interface MediaUrlResponse {
  mediaId: string;
  url: string; // Может быть прямой S3 URL или прокси URL
  isPublic: boolean;
  expiresAt?: Date; // Для presigned URLs
}
```

---

## Текущая реализация

Сейчас в коде:

- `getMediaUrls()` возвращает URL из медиа-сервиса
- Эти URL сохраняются в БД
- Фронтенд получает эти URL в ответах

**Нужно уточнить**: Какой формат URL возвращает медиа-микросервис?

- Если это прямой S3 URL → можно использовать напрямую (Вариант 3)
- Если это URL медиа-сервиса → лучше проксировать (Вариант 2)

---

## Рекомендация по реализации

1. **Краткосрочно**: Если медиа-сервис возвращает прямые S3 URLs, использовать их напрямую
2. **Долгосрочно**: Добавить прокси-эндпоинт на бэкенде для большей гибкости

### Пример реализации прокси

```typescript
// src/application/service/media.service.ts
async getMediaStream(mediaId: string, token: string): Promise<Readable> {
  const response = await this.httpClient.get(`/media/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'stream',
  });
  return response.data;
}

// src/infrastructure/routers/api/media.controller.ts
@Get(':mediaId')
async getMedia(
  @Param('mediaId') mediaId: string,
  @Token() token: string,
  @Res() res: Response,
) {
  const stream = await this.mediaService.getMediaStream(mediaId, token);
  stream.pipe(res);
}
```

---

## Итоговая рекомендация

**Использовать Вариант 2 (прокси через бэкенд)** для:

- Единообразия API
- Безопасности
- Гибкости в будущем

**Исключения:**

- Очень большие файлы (>100MB) → прямые S3 URLs
- Публичные статические файлы → CDN или прямые S3 URLs
