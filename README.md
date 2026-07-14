# University API — FastAPI + MongoDB + CastleMock

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

## О проекте

**University API** — готовый стенд для управления студентами, курсами и зачислениями.

В проект входят:

- REST API на FastAPI;
- панель управления на React;
- MongoDB с постоянным хранением данных;
- CastleMock с готовыми mock-сервисами;
- Docker Compose и health checks;
- интеграционные тесты.

---

## Стек технологий

- FastAPI, Uvicorn и Pydantic
- React, TypeScript и Vite
- Nginx
- MongoDB и PyMongo
- CastleMock
- Docker Compose
- Pytest

---

## Структура проекта

```text
university-api/
├── app/                    # FastAPI-приложение
├── frontend/               # React-панель
├── tests/                  # Интеграционные тесты
├── scripts/                # Backup и restore CastleMock
├── castlemock_reference/   # Эталон University API Mocks
├── backups/                # Локальные архивы CastleMock
├── docker-compose.yml
├── Dockerfile
├── main.py
└── README.md
```

---

## Установка и запуск

1. Перейди в папку проекта:

   ```bash
   cd university-api
   ```

2. Собери и запусти сервисы:

   ```bash
   docker compose up -d --build
   ```

3. Проверь контейнеры:

   ```bash
   docker compose ps
   ```

4. Открой панель управления:

   ```text
   http://localhost:3000
   ```

5. Открой Swagger UI:

   ```text
   http://localhost:8000/docs
   ```

---

## Остановка

Остановить сервисы без удаления данных:

```bash
docker compose down
```

Удалить Docker volumes вместе с данными MongoDB:

```bash
docker compose down -v
```

При следующем запуске CastleMock автоматически восстановится из эталона. MongoDB после `down -v` будет пустой.

---

## Доступ к сервисам

| Сервис | URL | Описание |
|---|---|---|
| Frontend | [http://localhost:3000](http://localhost:3000) | Панель управления |
| FastAPI Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| OpenAPI | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) | Схема API |
| CastleMock | [http://localhost:8080/castlemock](http://localhost:8080/castlemock) | Интерфейс моков |

Порты доступны только на `127.0.0.1`. Для удалённого сервера рекомендуется использовать reverse proxy и TLS.

---

## Основные endpoints

### Utility

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/health` | API, MongoDB и CastleMock |
| `POST` | `/seed` | Загрузить тестовые данные |

### Students

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/students` | Получить студентов |
| `POST` | `/students` | Создать студента |
| `GET` | `/students/{id}` | Получить студента |
| `PATCH` | `/students/{id}` | Обновить студента |
| `DELETE` | `/students/{id}` | Удалить студента |

### Courses

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/courses` | Получить курсы |
| `POST` | `/courses` | Создать курс |
| `GET` | `/courses/{id}` | Получить курс |
| `PATCH` | `/courses/{id}` | Обновить курс |
| `DELETE` | `/courses/{id}` | Удалить курс |

### Enrollments

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/enrollments` | Получить зачисления |
| `POST` | `/enrollments` | Зачислить студента |
| `GET` | `/enrollments/{id}` | Получить зачисление |
| `PATCH` | `/enrollments/{id}` | Обновить зачисление |
| `DELETE` | `/enrollments/{id}` | Удалить зачисление |

### CastleMock

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/external/weather` | Получить mock-прогноз |
| `POST` | `/external/student-verification` | Проверить студента |
| `POST` | `/external/enrollment-notification` | Отправить mock-уведомление |

---

## CastleMock: эталон и резервные копии

Готовый проект `University API Mocks` хранится в `castlemock_reference/`. При первом запуске он автоматически загружается в рабочий Docker volume.

Создать резервную копию текущих настроек:

```bash
./scripts/castlemock-backup.sh
```

Вернуть эталонное состояние:

```bash
./scripts/castlemock-restore.sh
```

Восстановить определённый архив:

```bash
./scripts/castlemock-restore.sh backups/<имя-архива>.tar.gz
```

Обычный перезапуск контейнера сохраняет рабочие изменения CastleMock. Возврат к эталону выполняется только командой restore.

---

## Примеры запросов

Проверить состояние системы:

```bash
curl http://localhost:8000/health
```

Загрузить тестовые данные:

```bash
curl -X POST http://localhost:8000/seed
```

Получить студентов:

```bash
curl http://localhost:8000/students
```

Проверить mock-прогноз:

```bash
curl http://localhost:8000/external/weather
```

---

## Тесты

Backend:

```bash
docker compose --profile test run --rm tests
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

---

## Примечания

- MongoDB использует named volume `mongo_data`.
- CastleMock использует named volume `castlemock_data`.
- Email студента уникален без учёта регистра.
- Повторное зачисление на тот же курс возвращает `409`.
- Удаление студента или курса удаляет связанные зачисления транзакционно.
- Все идентификаторы MongoDB проверяются как `ObjectId`.
- Образ CastleMock закреплён на `v1.68`.
- CastleMock предназначен для внутреннего тестового использования.
