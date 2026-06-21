from typing import List

from fastapi import APIRouter, HTTPException, status

from app.db import courses, enrollments
from app.models import Course, CourseOut, DeleteResponse
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Courses"])


@router.post(
    "/courses/",
    response_model=CourseOut,
    status_code=status.HTTP_201_CREATED,
    responses={422: {"description": "Validation error"}},
)
def create_course(course: Course):
    result = courses.insert_one(course.model_dump())
    return to_out(courses.find_one({"_id": result.inserted_id}), CourseOut)


@router.get("/courses/", response_model=List[CourseOut])
def list_courses():
    return [to_out(doc, CourseOut) for doc in courses.find()]


@router.put(
    "/courses/{course_id}",
    response_model=CourseOut,
    responses={
        400: {"description": "Invalid course ID"},
        404: {"description": "Course not found"},
        422: {"description": "Validation error"},
    },
)
def update_course(course_id: str, course: Course):
    object_id = parse_object_id(course_id, "course")
    result = courses.update_one({"_id": object_id}, {"$set": course.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    updated = courses.find_one({"_id": object_id})
    return to_out(updated, CourseOut)


@router.delete(
    "/courses/{course_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeleteResponse,
    responses={
        400: {"description": "Invalid course ID"},
        404: {"description": "Course not found"},
    },
)
def delete_course(course_id: str):
    object_id = parse_object_id(course_id, "course")
    result = courses.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollments.delete_many({"course_id": {"$in": [object_id, str(object_id)]}})
    return {"status": "deleted", "entity": "course", "id": course_id}
