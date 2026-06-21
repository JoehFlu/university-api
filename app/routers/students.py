from typing import List

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.db import enrollments, students
from app.models import DeleteResponse, Student, StudentOut
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Students"])


@router.post(
    "/students/",
    response_model=StudentOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
)
def create_student(student: Student):
    if students.find_one({"email": student.email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        result = students.insert_one(student.model_dump())
        return to_out(students.find_one({"_id": result.inserted_id}), StudentOut)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Email already registered") from exc


@router.get("/students/", response_model=List[StudentOut])
def list_students():
    return [to_out(doc, StudentOut) for doc in students.find()]


@router.put(
    "/students/{student_id}",
    response_model=StudentOut,
    responses={
        400: {"description": "Invalid student ID"},
        404: {"description": "Student not found"},
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
)
def update_student(student_id: str, student: Student):
    object_id = parse_object_id(student_id, "student")
    try:
        result = students.update_one({"_id": object_id}, {"$set": student.model_dump()})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        updated = students.find_one({"_id": object_id})
        return to_out(updated, StudentOut)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Email already registered") from exc


@router.delete(
    "/students/{student_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeleteResponse,
    responses={
        400: {"description": "Invalid student ID"},
        404: {"description": "Student not found"},
    },
)
def delete_student(student_id: str):
    object_id = parse_object_id(student_id, "student")
    result = students.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    enrollments.delete_many({"student_id": {"$in": [object_id, str(object_id)]}})
    return {"status": "deleted", "entity": "student", "id": student_id}
