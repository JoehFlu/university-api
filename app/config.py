MONGO_URL = "mongodb://mongo:27017"
MONGO_DB_NAME = "university_api"
MONGO_SERVER_SELECTION_TIMEOUT_MS = 3000
CASTLEMOCK_BASE_URL = "http://castlemock:8080/castlemock/mock/rest/project/QXcx23/application"
CASTLEMOCK_TIMEOUT_SECONDS = 3
APP_TITLE = "University API"
APP_VERSION = "0.1.0"

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
