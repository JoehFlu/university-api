from pymongo import ASCENDING, MongoClient

from app.config import (
    MONGO_DB_NAME,
    MONGO_SERVER_SELECTION_TIMEOUT_MS,
    MONGO_URL,
)


client = MongoClient(
    MONGO_URL,
    connect=False,
    serverSelectionTimeoutMS=MONGO_SERVER_SELECTION_TIMEOUT_MS,
    appname="university-api",
    retryReads=True,
    retryWrites=True,
)
db = client[MONGO_DB_NAME]

students = db["students"]
courses = db["courses"]
enrollments = db["enrollments"]


def ensure_indexes():
    students.create_index([("email", ASCENDING)], unique=True)
    courses.create_index([("title", ASCENDING)])
    enrollments.create_index(
        [("student_id", ASCENDING), ("course_id", ASCENDING)],
        unique=True,
    )


def run_transaction(callback):
    """Run a MongoDB transaction with PyMongo's transient-error retries."""
    with client.start_session() as session:
        return session.with_transaction(callback)
