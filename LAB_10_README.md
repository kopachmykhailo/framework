# Лабораторна робота №10 - Тестування та Docker для Fastify

## Структура проекту

Проект містить повну реалізацію Lab 10 з наступними компонентами:

### 1. Тестування (Vitest)
- **Unit тести**: `test/services/` - тестування сервісів (Auth, Items)
- **Integration тести**: `test/routes/` - тестування API маршрутів
- **Test setup**: `test/setup.js` - глобальна конфігурація тестів

### 2. Docker
- **Dockerfile**: Multi-stage build для production environment
- **docker-compose.yml**: Повна стек з app, MySQL, Redis
- **docker-compose.override.yml**: Development конфігурація
- **.dockerignore**: Исключение непотрібних файлів

## Встановлення та запуск

### Варіант 1: Локальне тестування (без Docker)

```bash
# Встановити залежності
npm install

# Запустити тести
npm run test

# Генерувати звіт про покриття
npm run test:coverage
```

**Примітка**: Для локального запуску тестів потрібні запущені MySQL та Redis на хостмашині.

### Варіант 2: Docker Compose (РЕКОМЕНДОВАНО)

#### Запуск production stack:
```bash
# Побудувати образ
docker-compose build

# Запустити всі сервіси
docker-compose up

# В іншому терміналі: запустити тести
docker-compose exec app npm run test
```

#### Запуск development stack:
```bash
# Автоматично використовує docker-compose.override.yml
docker-compose up

# Сервіс app буде перезавантажуватися при змінах коду
# Доступно на http://localhost:3000
```

#### Зупинення:
```bash
# Зупинити всі сервіси
docker-compose down

# Видалити томи даних
docker-compose down -v
```

## Структура тестів

### Unit тести (изоляція від зовнішніх сервісів)

**test/services/auth.service.test.js** (12 тестів)
- Register: нова користувач, дублікат, хешування паролю
- Login: успішний вхід, користувач не знайден, неправильний пароль
- Refresh: валідний токен, невалідний токен, невідповідність токенів
- Logout: додавання в чорний список, обробка відсутньої експірації

**test/services/items.service.test.js** (10 тестів)
- getItems: базова вибірка, кешування, пагінація, TTL
- invalidateCache: видалення ключів, обробка відсутності ключів
- createItem, updateItem, deleteItem з інвалідацією кешу

### Integration тести (повна обробка запитів)

**test/routes/auth.routes.test.js** (10 тестів)
- POST /api/v1/auth/register: успіх (201), валідація (400), дублікат (400)
- POST /api/v1/auth/login: успіх, не знайдено (401), неправильний пароль (401)
- GET /api/v1/auth/me: з токеном, без токена, невалідний токен

**test/routes/health.routes.test.js** (3 тесту)
- GET /api/v1/health: статус код, структура відповіді, значення статусу

**test/routes/items.routes.test.js** (12 тестів)
- GET /api/v2/items: пуста список, пагінація, метадані
- POST /api/v2/items: створення (201), структура
- GET /api/v2/items/:id: знайдено, 404
- PUT /api/v2/items/:id: оновлення (200), не знайдено (404)
- DELETE /api/v2/items/:id: видалення (200), 404, перевірка видалення

**Всього: 35 тестів**

## Конфігурація покриття

```javascript
thresholds: {
  lines: 70,      // 70% покриття рядків
  functions: 70,  // 70% покриття функцій
  branches: 70,   // 70% покриття гілок
  statements: 70  // 70% покриття інструкцій
}
```

## Мокування залежностей

### Unit тести
```javascript
// Мокування зовнішніх модулів
vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true)
}));

// Мокування сервісів через vi.fn()
const mockDb = {
  insert: vi.fn(),
  select: vi.fn()
};

const authService = new AuthService(mockDb, mockJwt, mockRedis);
```

### Integration тести
```javascript
// Використання реального app з inject() для симуляції HTTP
const response = await app.inject({
  method: 'POST',
  url: '/api/v1/auth/register',
  payload: { email: 'test@test.com', password: 'password123' }
});

expect(response.statusCode).toBe(201);
```

## Docker образи та сервіси

### app (Node.js 20-alpine)
- **Target**: `runner` (production) або `builder` (development)
- **Порт**: 3000
- **Health check**: GET /api/v1/health кожні 30 секунд
- **Залежності**: MySQL, Redis з `service_healthy` умовою

### mysql (8.0)
- **Контейнер**: lab-mysql
- **Порт**: 3306
- **Database**: lab_books
- **Volume**: mysql_data:/var/lib/mysql
- **Health check**: mysqladmin ping

### redis (7-alpine)
- **Контейнер**: lab-redis
- **Порт**: 6379
- **Volume**: redis_data:/data
- **Health check**: redis-cli ping

## Змінні середовища

```bash
NODE_ENV=production
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=lab_books
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=super_secret_jwt_key_which_is_long_enough_123456
```

## Перевірка роботи

### Локально (з Docker)
```bash
# Запустити full stack
docker-compose up

# В іншому терміналі
curl http://localhost:3000/api/v1/health

# Запустити тести
docker-compose exec app npm run test

# Переглянути звіт покриття
docker-compose exec app npm run test:coverage
```

### Логи
```bash
# Логи всіх сервісів
docker-compose logs

# Логи тільки app
docker-compose logs app

# Follow логи
docker-compose logs -f
```

## Git

```bash
# Створити нову гілку
git checkout -b Lab_10

# Додати файли
git add .

# Commit
git commit -m "Lab 10: Testing and Docker for Fastify application"

# Push
git push -u origin Lab_10
```

## Результати покриття

Після запуску `npm run test:coverage` звіт буде в `coverage/` директорії:
- **HTML звіт**: `coverage/index.html`
- **Text звіт**: Виведено в консоль

## Проблеми та рішення

### Problem: Redis connection timeout
**Рішення**: Переконайтеся, що Redis запущений через docker-compose або локально на 6379 порті

### Problem: MySQL connection refused
**Рішення**: Переконайтеся, що MySQL запущений через docker-compose або локально на 3306 порті

### Problem: Tests timeout
**Рішення**: Збільшено `hookTimeout` та `testTimeout` до 30000ms в `vitest.config.js`

## Посилання

- [Vitest документація](https://vitest.dev/)
- [Fastify тестування](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose](https://docs.docker.com/compose/)
