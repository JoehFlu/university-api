from datetime import datetime, timezone
from threading import Lock

from faker import Faker
from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.config import APP_TITLE, APP_VERSION
from app.db import client, courses, enrollments, run_transaction, students
from app.models import ErrorResponse, HealthResponse, SeedResponse
from app.utils import check_castlemock


router = APIRouter(tags=["Utility"])
fake = Faker()
seed_lock = Lock()


@router.post("/seed", response_model=SeedResponse)
def seed_data():
    with seed_lock:
        fake.unique.clear()
        student_docs = [
            {
                "name": fake.name(),
                "age": fake.random_int(min=18, max=30),
                "email": fake.unique.email().lower(),
            }
            for _ in range(10)
        ]
        course_docs = [
            {
                "title": fake.job(),
                "description": fake.text(max_nb_chars=50),
            }
            for _ in range(3)
        ]

        def replace_demo_data(session):
            enrollments.delete_many({}, session=session)
            students.delete_many({}, session=session)
            courses.delete_many({}, session=session)
            student_ids = students.insert_many(
                student_docs,
                session=session,
            ).inserted_ids
            course_ids = courses.insert_many(
                course_docs,
                session=session,
            ).inserted_ids
            enrollment_docs = [
                {
                    "student_id": student_id,
                    "course_id": fake.random_element(course_ids),
                    "enrolled_at": datetime.now(timezone.utc),
                }
                for student_id in student_ids
            ]
            enrollments.insert_many(enrollment_docs, session=session)

        run_transaction(replace_demo_data)

    return {"message": "Database seeded successfully"}


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={503: {"model": ErrorResponse, "description": "MongoDB is unavailable"}},
)
def health_check():
    database_health()
    try:
        check_castlemock()
        castlemock_status = "ok"
    except HTTPException:
        castlemock_status = "unavailable"

    return {
        "status": "ok" if castlemock_status == "ok" else "degraded",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "mongodb": "ok",
        "castlemock": castlemock_status,
    }


@router.get("/ready", include_in_schema=False)
def readiness_check():
    database_health()
    return {"status": "ok"}


def database_health():
    try:
        client.admin.command("ping")
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable",
        ) from exc
