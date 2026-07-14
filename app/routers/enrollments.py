from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.db import courses, enrollments, students
from app.models import (
    DeleteResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentUpdate,
    ErrorResponse,
    ObjectIdStr,
)
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Enrollments"])

ERROR_400 = {"model": ErrorResponse, "description": "Invalid enrollment, student, or course ID"}
ERROR_404 = {"model": ErrorResponse, "description": "Enrollment, student, or course not found"}
ERROR_409 = {"model": ErrorResponse, "description": "Enrollment already exists"}


def related_ids_or_404(payload: EnrollmentCreate | EnrollmentUpdate, current: dict | None = None):
    student_id = payload.student_id if payload.student_id is not None else current["student_id"]
    course_id = payload.course_id if payload.course_id is not None else current["course_id"]
    student_object_id = parse_object_id(student_id, "student")
    course_object_id = parse_object_id(course_id, "course")
    if not students.find_one({"_id": student_object_id}):
        raise HTTPException(status_code=404, detail="Student not found")
    if not courses.find_one({"_id": course_object_id}):
        raise HTTPException(status_code=404, detail="Course not found")
    return student_object_id, course_object_id


@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, responses={400: ERROR_400, 404: ERROR_404, 409: ERROR_409})
def create_enrollment(enrollment: EnrollmentCreate):
    student_object_id, course_object_id = related_ids_or_404(enrollment)
    try:
        result = enrollments.insert_one({"student_id": student_object_id, "course_id": course_object_id, "enrolled_at": datetime.now(timezone.utc)})
        return to_out(enrollments.find_one({"_id": result.inserted_id}), EnrollmentResponse)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Enrollment already exists") from exc


@router.get("/enrollments", response_model=list[EnrollmentResponse])
def list_enrollments():
    return [to_out(doc, EnrollmentResponse) for doc in enrollments.find()]


@router.get("/enrollments/{enrollment_id}", response_model=EnrollmentResponse, responses={400: ERROR_400, 404: ERROR_404})
def get_enrollment(enrollment_id: ObjectIdStr):
    object_id = parse_object_id(enrollment_id, "enrollment")
    enrollment = enrollments.find_one({"_id": object_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return to_out(enrollment, EnrollmentResponse)


@router.patch("/enrollments/{enrollment_id}", response_model=EnrollmentResponse, responses={400: ERROR_400, 404: ERROR_404, 409: ERROR_409})
def update_enrollment(enrollment_id: ObjectIdStr, enrollment: EnrollmentUpdate):
    enrollment_object_id = parse_object_id(enrollment_id, "enrollment")
    current = enrollments.find_one({"_id": enrollment_object_id})
    if not current:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    student_object_id, course_object_id = related_ids_or_404(enrollment, current)
    try:
        enrollments.update_one({"_id": enrollment_object_id}, {"$set": {"student_id": student_object_id, "course_id": course_object_id}})
        return to_out(enrollments.find_one({"_id": enrollment_object_id}), EnrollmentResponse)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Enrollment already exists") from exc


@router.delete("/enrollments/{enrollment_id}", response_model=DeleteResponse, responses={400: ERROR_400, 404: ERROR_404})
def delete_enrollment(enrollment_id: ObjectIdStr):
    object_id = parse_object_id(enrollment_id, "enrollment")
    result = enrollments.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return {"status": "deleted", "entity": "enrollment", "id": enrollment_id}
