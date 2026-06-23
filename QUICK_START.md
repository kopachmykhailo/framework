# 🚀 Quick Start - Lab 10

## За 5 хвилин

### 1️⃣ Запустити Docker stack

**Windows (PowerShell):**
```powershell
# Запустити interactive menu
.\run-lab10.ps1
# Вибрати опцію 3 для dev stack або 2 для production
```

**macOS/Linux:**
```bash
# Запустити interactive menu
bash run-lab10.sh
# Вибрати опцію 3 для dev stack або 2 для production
```

**Або вручну:**
```bash
# Development (з auto-reload)
docker-compose up

# Production
docker-compose -f docker-compose.yml up
```

### 2️⃣ Запустити тести

**В контейнері:**
```bash
# В новому терміналі
docker-compose exec app npm run test
```

**З звітом про покриття:**
```bash
docker-compose exec app npm run test:coverage
```

### 3️⃣ Перевірити роботу API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Реєстрація користувача
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123"}'

# Вхід
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123"}'

# Отримати список книг
curl http://localhost:3000/api/v2/items?page=1&limit=10
```

## 📊 Структура

```
test/
├── setup.js                           # Global test configuration
├── services/
│   ├── auth.service.test.js          # 12 unit tests
│   └── items.service.test.js         # 10 unit tests
└── routes/
    ├── auth.routes.test.js           # 10 integration tests
    ├── health.routes.test.js         # 3 integration tests
    └── items.routes.test.js          # 12 integration tests
```

**Всього: 47 тестів, 70% покриття**

## 🐳 Docker Stack

```
┌─────────────────────────────────────┐
│  app (Node.js 20-alpine)            │
│  Port: 3000                         │
├─────────────────────────────────────┤
│  Dependencies:                      │
│  • mysql:8.0 (Port 3306)            │
│  • redis:7-alpine (Port 6379)       │
└─────────────────────────────────────┘
```

## 🧪 Test Coverage

| Категорія | Файли | Тести |
|-----------|-------|-------|
| Unit Tests | auth.service, items.service | 22 |
| Integration Tests | auth.routes, health.routes, items.routes | 25 |
| **Total** | - | **47** |

## 📝 Шкала

- ✅ **Unit тески**: Тестування бізнес-логіки в ізоляції
- ✅ **Integration тести**: Тестування API на рівні Fastify
- ✅ **Docker**: Мультистадійні образи з production/dev конфігурацією
- ✅ **Coverage**: 70% покриття всіх метрик

## 🔍 Основні тестові сценарії

### Auth Service
- Реєстрація користувача з валідацією
- Вхід з перевіркою паролю (argon2)
- Refresh токен механізм
- Logout з чорним списком токенів

### Items Service
- Пагінована вибірка з кешуванням Redis
- CRUD операції з інвалідацією кешу
- 24-годинний TTL для кешу

### API Routes
- Валідація статус кодів (201, 200, 400, 401, 404)
- Перевірка структури відповідей
- JWT аутентифікація
- Пошаговий тест потоків (регістрація → логін → доступ до даних)

## 📋 Конфігурація Vitest

```javascript
{
  hookTimeout: 30000,      // 30 сек для інтеграційних тестів
  testTimeout: 30000,      // 30 сек на тест
  coverage: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

## 🎯 Наступні кроки

1. **Запустити тести в Docker** - переконатися що все працює
2. **Розглянути звіт покриття** - `docker-compose exec app npm run test:coverage`
3. **Зробити комміт** - `git add . && git commit -m "Lab 10: Complete"`
4. **Створити PR** - на основну гілку

## 🆘 Рішення проблем

**Проблема**: Порти зайняті
```bash
# Дізнатися що використовує порт 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

**Проблема**: Помилка підключення до БД
```bash
# Перевірити статус сервісів
docker-compose ps

# Переглянути логи
docker-compose logs mysql
```

**Проблема**: Redis timeout
```bash
# Перезапустити Redis
docker-compose restart redis
```

## 📚 Документація

- [Детальна документація](./LAB_10_README.md)
- [Vitest Docs](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Docker Docs](https://docs.docker.com/)
