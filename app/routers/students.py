from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.db import enrollments, students
from app.models import (
    DeleteResponse,
    ErrorResponse,
    ObjectIdStr,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
)
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Students"])

ERROR_400 = {"model": ErrorResponse, "description": "Invalid student ID"}
ERROR_404 = {"model": ErrorResponse, "description": "Student not found"}
ERROR_409 = {"model": ErrorResponse, "description": "Email already registered"}


@router.post(
    "/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: ERROR_409},
)
def create_student(student: StudentCreate):
    if students.find_one({"email": student.email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        result = students.insert_one(student.model_dump())
        return to_out(students.find_one({"_id": result.inserted_id}), StudentResponse)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Email already registered") from exc


@router.get("/students", response_model=list[StudentResponse])
def list_students():
    return [to_out(doc, StudentResponse) for doc in students.find()]


@router.get("/students/{student_id}", response_model=StudentResponse, responses={400: ERROR_400, 404: ERROR_404})
def get_student(student_id: ObjectIdStr):
    object_id = parse_object_id(student_id, "student")
    student = students.find_one({"_id": object_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return to_out(student, StudentResponse)


@router.patch(
    "/students/{student_id}",
    response_model=StudentResponse,
    responses={400: ERROR_400, 404: ERROR_404, 409: ERROR_409},
)
def update_student(student_id: ObjectIdStr, student: StudentUpdate):
    object_id = parse_object_id(student_id, "student")
    try:
        result = students.update_one(
            {"_id": object_id}, {"$set": student.model_dump(exclude_unset=True)}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        return to_out(students.find_one({"_id": object_id}), StudentResponse)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Email already registered") from exc


@router.delete(
    "/students/{student_id}",
    response_model=DeleteResponse,
    responses={400: ERROR_400, 404: ERROR_404},
)
def delete_student(student_id: ObjectIdStr):
    object_id = parse_object_id(student_id, "student")
    result = students.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    enrollments.delete_many({"student_id": {"$in": [object_id, str(object_id)]}})
    return {"status": "deleted", "entity": "student", "id": student_id}
