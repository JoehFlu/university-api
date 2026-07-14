import os


MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://mongo:27017/?replicaSet=rs0&retryWrites=true&w=majority",
)
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "university_api")
MONGO_SERVER_SELECTION_TIMEOUT_MS = int(
    os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000")
)
CASTLEMOCK_BASE_URL = os.getenv(
    "CASTLEMOCK_BASE_URL",
    "http://castlemock:8080/castlemock/mock/rest/project/QXcx23/application",
)
CASTLEMOCK_HEALTH_PATH = os.getenv("CASTLEMOCK_HEALTH_PATH", "hE4lTh/health")
CASTLEMOCK_TIMEOUT_SECONDS = float(os.getenv("CASTLEMOCK_TIMEOUT_SECONDS", "3"))
APP_TITLE = os.getenv("APP_TITLE", "University API")
APP_VERSION = os.getenv("APP_VERSION", "0.2.0")
LIST_DEFAULT_LIMIT = int(os.getenv("LIST_DEFAULT_LIMIT", "100"))
LIST_MAX_LIMIT = int(os.getenv("LIST_MAX_LIMIT", "500"))

TAGS_METADATA = [
    {
        "name": "Utility",
        "description": "🔧 Вспомогательные эндпоинты (seed, health, и т.д.)",
    },
    {
        "name": "Students",
        "description": "👩‍🎓 CRUD операции со студентами",
    },
    {
        "name": "Courses",
        "description": "📚 CRUD операции с курсами",
    },
    {
        "name": "Enrollments",
        "description": "📝 CRUD операции с записями студентов на курсы",
    },
    {
        "name": "CastleMock",
        "description": "🌤️ Пример обращения к внешнему (mock) API",
    },
]
