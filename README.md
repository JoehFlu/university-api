# University API — FastAPI + MongoDB + CastleMock

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-latest-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

## О проекте

**University API** — это REST API на FastAPI для управления студентами, курсами и записями на курсы.  
Проект работает с MongoDB, запускается через Docker Compose и содержит набор мок-эндпоинтов через CastleMock.

Основные возможности:

- CRUD для студентов
- CRUD для курсов
- CRUD для записей на курсы
- `seed` для быстрого заполнения базы тестовыми данными
- `health` для проверки состояния API
- примеры запросов к внешнему mock API

---

## Стек технологий

- FastAPI
- React
- TypeScript
- Vite
- Nginx
- Uvicorn
- MongoDB
- PyMongo
- Pydantic
- Faker
- Requests
- CastleMock
- Docker Compose

---

## Структура проекта

```text
university-api/
├── frontend/
├── app/
│   ├── routers/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── models.py
│   └── utils.py
├── castlemock_data_persistent/
├── Dockerfile
├── docker-compose.yml
├── main.py
├── requirements.txt
└── README.md
```

Коротко по структуре:

- `main.py` — точка входа приложения.
- `app/app.py` — создание FastAPI-приложения и подключение роутов.
- `app/config.py` — конфигурация MongoDB, CastleMock и метаданных API.
- `app/db.py` — подключение к базе и создание индексов.
- `app/models.py` — Pydantic-модели запросов и ответов.
- `app/utils.py` — вспомогательные функции для `ObjectId` и CastleMock.
- `app/routers/` — эндпоинты по сущностям и служебные маршруты.

---

## Установка и запуск

1. Перейди в папку проекта:
   ```bash
   cd ~/Downloads/university-api
   ```

2. Собери и запусти контейнеры:
   ```bash
   docker compose up --build
   ```

3. Открой Swagger UI:
   ```text
   http://localhost:8000/docs
   ```

4. Открой панель управления:
   ```text
   http://localhost:3000
   ```

---

## Остановка

```bash
docker compose down
```

Если нужно удалить данные MongoDB:

```bash
docker compose down -v
```

---

## Требования

- Docker
- Docker Compose
- Python 3.11+ только если планируешь запускать проект локально без Docker

Проверка окружения:

```bash
docker --version
docker compose version
python3 --version
```

---

## Доступ к сервисам

| Сервис | URL | Описание |
|--------|-----|-----------|
| Frontend | [http://localhost:3000](http://localhost:3000) | Панель управления |
| FastAPI Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| OpenAPI schema | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) | Схема API |
| MongoDB | `mongodb://localhost:27017` | База данных |
| CastleMock | [http://localhost:8080/castlemock](http://localhost:8080/castlemock) | Интерфейс моков |

---

## Основные эндпоинты

### Utility

| Метод | Эндпоинт | Описание |
|-------|----------|-----------|
| `POST` | `/seed/` | Заполнить базу тестовыми данными |
| `GET` | `/health` | Проверить состояние API |

### Students

| Метод | Эндпоинт | Описание |
|-------|----------|-----------|
| `GET` | `/students/` | Получить список студентов |
| `POST` | `/students/` | Создать студента |
| `PUT` | `/students/{student_id}` | Обновить студента |
| `DELETE` | `/students/{student_id}` | Удалить студента |

### Courses

| Метод | Эндпоинт | Описание |
|-------|----------|-----------|
| `GET` | `/courses/` | Получить список курсов |
| `POST` | `/courses/` | Создать курс |
| `PUT` | `/courses/{course_id}` | Обновить курс |
| `DELETE` | `/courses/{course_id}` | Удалить курс |

### Enrollments

| Метод | Эндпоинт | Описание |
|-------|----------|-----------|
| `GET` | `/enrollments/` | Получить список записей |
| `POST` | `/enrollments/` | Записать студента на курс |
| `PUT` | `/enrollments/{enrollment_id}` | Обновить запись |
| `DELETE` | `/enrollments/{enrollment_id}` | Удалить запись |

### CastleMock

| Метод | Эндпоинт | Описание |
|-------|----------|-----------|
| `GET` | `/external/weather` | Мок прогноза погоды |
| `POST` | `/external/auth/login` | Мок логина |
| `PUT` | `/external/user/update` | Мок обновления профиля |

---

## Коды ответов

| Код | Когда возвращается |
|-----|-------------------|
| `200` | Успешный ответ |
| `400` | Некорректный `id` |
| `409` | Дубликат email или enrollment |
| `404` | Сущность не найдена |
| `422` | Ошибка валидации входных данных |
| `503` | MongoDB недоступна |
| `502` | CastleMock недоступен |

---

## Примеры запросов

Быстрая проверка API:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/seed/
```

Работа со студентами:

```bash
curl http://localhost:8000/students/
curl -X POST http://localhost:8000/students/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Ivan Petrov","age":21,"email":"ivan@example.com"}'
```

CastleMock:

```bash
curl http://localhost:8000/external/weather
curl -X POST http://localhost:8000/external/auth/login
curl -X PUT http://localhost:8000/external/user/update
```

---

## Примечания

- Индексы создаются автоматически при старте приложения.
- У студентов уникальный `email`.
- У записей на курс уникальная комбинация `student_id + course_id`.
- Данные CastleMock сохраняются в `castlemock_data_persistent/`, поэтому не теряются после перезапуска контейнеров.
