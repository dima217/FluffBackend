# Руководство по использованию пагинации API

## Обзор

API поддерживает пагинацию для следующих endpoints:

- `GET /api/products` - получение списка продуктов
- `GET /api/recipes` - получение списка рецептов

## Параметры запроса

### Query параметры

| Параметр | Тип    | Обязательный | По умолчанию | Диапазон | Описание                         |
| -------- | ------ | ------------ | ------------ | -------- | -------------------------------- |
| `page`   | number | Нет          | 1            | 1+       | Номер страницы (начинается с 1)  |
| `limit`  | number | Нет          | 10           | 1-100    | Количество элементов на странице |

### Примеры запросов

```http
# Получить первую страницу (10 элементов по умолчанию)
GET /api/products

# Получить первую страницу с 20 элементами
GET /api/products?page=1&limit=20

# Получить вторую страницу с 10 элементами
GET /api/products?page=2&limit=10

# Получить третью страницу с 25 элементами
GET /api/recipes?page=3&limit=25
```

## Формат ответа

Все ответы с пагинацией имеют следующую структуру:

```json
{
  "data": [
    // Массив элементов (продуктов или рецептов)
  ],
  "meta": {
    "page": 1, // Текущая страница
    "limit": 10, // Количество элементов на странице
    "total": 100, // Общее количество элементов
    "totalPages": 10 // Общее количество страниц
  }
}
```

### Пример ответа для продуктов

```json
{
  "data": [
    {
      "id": 1,
      "name": "Молоко",
      "calories": 64,
      "massa": 100,
      "image": {
        "cover": "http://localhost:3000/api/media/507f1f77bcf86cd799439011",
        "preview": "http://localhost:3000/api/media/507f1f77bcf86cd799439012"
      },
      "isFavorite": false
    }
    // ... еще 9 продуктов
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Реализация на фронтенде

### TypeScript/JavaScript пример

```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Функция для получения продуктов с пагинацией
async function getProducts(
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Product>> {
  const response = await fetch(`/api/products?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`, // Опционально, если нужны избранные
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Использование
const result = await getProducts(1, 20);
console.log(`Получено ${result.data.length} продуктов из ${result.meta.total}`);
console.log(`Страница ${result.meta.page} из ${result.meta.totalPages}`);
```

### React пример с хуками

```typescript
import { useState, useEffect } from 'react';

interface UsePaginationResult<T> {
  data: T[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  changeLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

function usePagination<T>(
  endpoint: string,
  initialPage: number = 1,
  initialLimit: number = 10
): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${endpoint}?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Опционально
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: PaginatedResponse<T> = await response.json();
        setData(result.data);
        setMeta(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, page, limit]);

  const goToPage = (newPage: number) => {
    if (meta && newPage >= 1 && newPage <= meta.totalPages) {
      setPage(newPage);
    }
  };

  const changeLimit = (newLimit: number) => {
    if (newLimit >= 1 && newLimit <= 100) {
      setLimit(newLimit);
      setPage(1); // Сброс на первую страницу при изменении лимита
    }
  };

  const nextPage = () => {
    if (meta && page < meta.totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return {
    data,
    meta,
    loading,
    error,
    goToPage,
    changeLimit,
    nextPage,
    prevPage,
  };
}

// Использование в компоненте
function ProductsList() {
  const { data, meta, loading, error, goToPage, nextPage, prevPage } = usePagination<Product>(
    '/api/products',
    1,
    10
  );

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <div>
      <h2>Продукты</h2>

      {/* Список продуктов */}
      <ul>
        {data.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>

      {/* Пагинация */}
      {meta && (
        <div>
          <p>
            Страница {meta.page} из {meta.totalPages} (Всего: {meta.total})
          </p>

          <button onClick={prevPage} disabled={meta.page === 1}>
            Предыдущая
          </button>

          {/* Номера страниц */}
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              disabled={pageNum === meta.page}
            >
              {pageNum}
            </button>
          ))}

          <button onClick={nextPage} disabled={meta.page === meta.totalPages}>
            Следующая
          </button>
        </div>
      )}
    </div>
  );
}
```

### Vue.js пример

```vue
<template>
  <div>
    <h2>Продукты</h2>

    <div v-if="loading">Загрузка...</div>
    <div v-else-if="error">Ошибка: {{ error }}</div>
    <div v-else>
      <ul>
        <li v-for="product in data" :key="product.id">
          {{ product.name }}
        </li>
      </ul>

      <div v-if="meta">
        <p>Страница {{ meta.page }} из {{ meta.totalPages }} (Всего: {{ meta.total }})</p>

        <button @click="prevPage" :disabled="meta.page === 1">Предыдущая</button>

        <button
          v-for="pageNum in totalPages"
          :key="pageNum"
          @click="goToPage(pageNum)"
          :disabled="pageNum === meta.page"
        >
          {{ pageNum }}
        </button>

        <button @click="nextPage" :disabled="meta.page === meta.totalPages">Следующая</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

const data = ref([]);
const meta = ref(null);
const loading = ref(true);
const error = ref(null);
const page = ref(1);
const limit = ref(10);

const totalPages = computed(() => {
  return meta.value ? Array.from({ length: meta.value.totalPages }, (_, i) => i + 1) : [];
});

async function fetchProducts() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/products?page=${page.value}&limit=${limit.value}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Опционально
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    data.value = result.data;
    meta.value = result.meta;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function goToPage(newPage: number) {
  if (meta.value && newPage >= 1 && newPage <= meta.value.totalPages) {
    page.value = newPage;
  }
}

function nextPage() {
  if (meta.value && page.value < meta.value.totalPages) {
    page.value++;
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
  }
}

watch([page, limit], () => {
  fetchProducts();
});

onMounted(() => {
  fetchProducts();
});
</script>
```

## Важные замечания

1. **Нумерация страниц**: Страницы начинаются с 1, а не с 0
2. **Максимальный лимит**: Максимальное значение `limit` - 100. Запросы с большим значением могут быть отклонены
3. **Минимальные значения**: `page` и `limit` должны быть >= 1
4. **Опциональная аутентификация**: Токен не обязателен, но если он передан, в ответе будет информация об избранных элементах (`isFavorite`)
5. **Пустые результаты**: Если запрошена страница, которой не существует, вернется пустой массив `data` с корректными метаданными

## Обработка ошибок

```typescript
try {
  const result = await getProducts(1, 10);

  if (result.data.length === 0 && result.meta.page > result.meta.totalPages) {
    // Запрошена несуществующая страница
    console.warn('Запрошена страница, которой не существует');
  }
} catch (error) {
  if (error instanceof TypeError) {
    // Проблема с сетью
    console.error('Ошибка сети:', error);
  } else {
    // Другая ошибка
    console.error('Ошибка:', error);
  }
}
```

## Оптимизация производительности

1. **Кэширование**: Кэшируйте результаты для уже загруженных страниц
2. **Предзагрузка**: Предзагружайте следующую страницу при приближении к концу списка
3. **Виртуализация**: Для больших списков используйте виртуализацию (например, react-window, vue-virtual-scroller)

## Пример с кэшированием

```typescript
class PaginationCache<T> {
  private cache = new Map<string, PaginatedResponse<T>>();

  getKey(page: number, limit: number): string {
    return `${page}-${limit}`;
  }

  get(page: number, limit: number): PaginatedResponse<T> | undefined {
    return this.cache.get(this.getKey(page, limit));
  }

  set(page: number, limit: number, data: PaginatedResponse<T>): void {
    this.cache.set(this.getKey(page, limit), data);
  }

  clear(): void {
    this.cache.clear();
  }
}

const productsCache = new PaginationCache<Product>();

async function getProductsCached(page: number, limit: number): Promise<PaginatedResponse<Product>> {
  // Проверяем кэш
  const cached = productsCache.get(page, limit);
  if (cached) {
    return cached;
  }

  // Загружаем данные
  const result = await getProducts(page, limit);

  // Сохраняем в кэш
  productsCache.set(page, limit, result);

  return result;
}
```
