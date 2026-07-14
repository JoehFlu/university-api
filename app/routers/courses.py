from fastapi import APIRouter, HTTPException, status

from app.db import courses, enrollments
from app.models import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    DeleteResponse,
    ErrorResponse,
    ObjectIdStr,
)
from app.utils import parse_object_id, to_out


router = APIRouter(tags=["Courses"])

ERROR_400 = {"model": ErrorResponse, "description": "Invalid course ID"}
ERROR_404 = {"model": ErrorResponse, "description": "Course not found"}


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course: CourseCreate):
    result = courses.insert_one(course.model_dump())
    return to_out(courses.find_one({"_id": result.inserted_id}), CourseResponse)


@router.get("/courses", response_model=list[CourseResponse])
def list_courses():
    return [to_out(doc, CourseResponse) for doc in courses.find()]


@router.get("/courses/{course_id}", response_model=CourseResponse, responses={400: ERROR_400, 404: ERROR_404})
def get_course(course_id: ObjectIdStr):
    object_id = parse_object_id(course_id, "course")
    course = courses.find_one({"_id": object_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return to_out(course, CourseResponse)


@router.patch("/courses/{course_id}", response_model=CourseResponse, responses={400: ERROR_400, 404: ERROR_404})
def update_course(course_id: ObjectIdStr, course: CourseUpdate):
    object_id = parse_object_id(course_id, "course")
    result = courses.update_one(
        {"_id": object_id}, {"$set": course.model_dump(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return to_out(courses.find_one({"_id": object_id}), CourseResponse)


@router.delete("/courses/{course_id}", response_model=DeleteResponse, responses={400: ERROR_400, 404: ERROR_404})
def delete_course(course_id: ObjectIdStr):
    object_id = parse_object_id(course_id, "course")
    result = courses.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollments.delete_many({"course_id": {"$in": [object_id, str(object_id)]}})
    return {"status": "deleted", "entity": "course", "id": course_id}
