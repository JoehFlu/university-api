from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.db import courses, enrollments, students
from app.models import DeleteResponse, Enrollment, EnrollmentOut
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Enrollments"])


@router.post(
    "/enrollments/",
    response_model=EnrollmentOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": "Invalid student or course ID"},
        404: {"description": "Student or course not found"},
        409: {"description": "Enrollment already exists"},
        422: {"description": "Validation error"},
    },
)
def create_enrollment(enrollment: Enrollment):
    student_object_id = parse_object_id(enrollment.student_id, "student")
    course_object_id = parse_object_id(enrollment.course_id, "course")
    if not students.find_one({"_id": student_object_id}):
        raise HTTPException(status_code=404, detail="Student not found")
    if not courses.find_one({"_id": course_object_id}):
        raise HTTPException(status_code=404, detail="Course not found")
    try:
        result = enrollments.insert_one(
            {
                "student_id": student_object_id,
                "course_id": course_object_id,
                "enrolled_at": datetime.now(timezone.utc),
            }
        )
        return to_out(enrollments.find_one({"_id": result.inserted_id}), EnrollmentOut)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Enrollment already exists") from exc


@router.get("/enrollments/", response_model=List[EnrollmentOut])
def list_enrollments():
    return [to_out(doc, EnrollmentOut) for doc in enrollments.find()]


@router.put(
    "/enrollments/{enrollment_id}",
    response_model=EnrollmentOut,
    responses={
        400: {"description": "Invalid enrollment, student, or course ID"},
        404: {"description": "Enrollment, student, or course not found"},
        409: {"description": "Enrollment already exists"},
        422: {"description": "Validation error"},
    },
)
def update_enrollment(enrollment_id: str, enrollment: Enrollment):
    enrollment_object_id = parse_object_id(enrollment_id, "enrollment")
    student_object_id = parse_object_id(enrollment.student_id, "student")
    course_object_id = parse_object_id(enrollment.course_id, "course")
    if not students.find_one({"_id": student_object_id}):
        raise HTTPException(status_code=404, detail="Student not found")
    if not courses.find_one({"_id": course_object_id}):
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        result = enrollments.update_one(
            {"_id": enrollment_object_id},
            {"$set": {"student_id": student_object_id, "course_id": course_object_id}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        updated = enrollments.find_one({"_id": enrollment_object_id})
        return to_out(updated, EnrollmentOut)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Enrollment already exists") from exc


@router.delete(
    "/enrollments/{enrollment_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeleteResponse,
    responses={
        400: {"description": "Invalid enrollment ID"},
        404: {"description": "Enrollment not found"},
    },
)
def delete_enrollment(enrollment_id: str):
    object_id = parse_object_id(enrollment_id, "enrollment")
    result = enrollments.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return {"status": "deleted", "entity": "enrollment", "id": enrollment_id}
