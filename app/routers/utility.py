from datetime import datetime, timezone

from faker import Faker
from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.config import APP_TITLE, APP_VERSION
from app.db import client, courses, enrollments, students
from app.models import HealthResponse, SeedResponse


router = APIRouter(tags=["Utility"])
fake = Faker()


@router.post("/seed/", response_model=SeedResponse)
def seed_data():
    students.delete_many({})
    courses.delete_many({})
    enrollments.delete_many({})
    fake.unique.clear()

    student_ids = [
        students.insert_one(
            {
                "name": fake.name(),
                "age": fake.random_int(min=18, max=30),
                "email": fake.unique.email(),
            }
        ).inserted_id
        for _ in range(10)
    ]

    course_ids = [
        courses.insert_one(
            {
                "title": fake.job(),
                "description": fake.text(max_nb_chars=50),
            }
        ).inserted_id
        for _ in range(3)
    ]

    for student_id in student_ids:
        enrollments.insert_one(
            {
                "student_id": student_id,
                "course_id": fake.random_element(course_ids),
                "enrolled_at": datetime.now(timezone.utc),
            }
        )

    return {"message": "Database seeded successfully"}


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={503: {"description": "MongoDB is unavailable"}},
)
def health_check():
    try:
        client.admin.command("ping")
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable",
        ) from exc

    return {
        "status": "ok",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "mongodb": "ok",
    }
