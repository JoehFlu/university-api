from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Student(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "name": "Ivan Petrov",
                "age": 21,
                "email": "ivan.petrov@example.com",
            }
        },
    )

    name: str = Field(
        min_length=1,
        max_length=100,
        examples=["Ivan Petrov"],
    )
    age: int = Field(ge=16, le=120, examples=[21])
    email: EmailStr = Field(examples=["ivan.petrov@example.com"])


class StudentOut(Student):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Ivan Petrov",
                "age": 21,
                "email": "ivan.petrov@example.com",
                "id": "665f1d8b2c4a7e0012ab34cd",
            }
        }
    )

    id: str = Field(examples=["665f1d8b2c4a7e0012ab34cd"])


class Course(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "title": "Introduction to Python",
                "description": "Python fundamentals for beginners",
            }
        },
    )

    title: str = Field(
        min_length=1,
        max_length=200,
        examples=["Introduction to Python"],
    )
    description: str = Field(
        min_length=1,
        max_length=2000,
        examples=["Python fundamentals for beginners"],
    )


class CourseOut(Course):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Introduction to Python",
                "description": "Python fundamentals for beginners",
                "id": "665f1dc62c4a7e0012ab34ce",
            }
        }
    )

    id: str = Field(examples=["665f1dc62c4a7e0012ab34ce"])


class Enrollment(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "665f1d8b2c4a7e0012ab34cd",
                "course_id": "665f1dc62c4a7e0012ab34ce",
            }
        }
    )

    student_id: str = Field(examples=["665f1d8b2c4a7e0012ab34cd"])
    course_id: str = Field(examples=["665f1dc62c4a7e0012ab34ce"])


class EnrollmentOut(Enrollment):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "665f1d8b2c4a7e0012ab34cd",
                "course_id": "665f1dc62c4a7e0012ab34ce",
                "id": "665f1df82c4a7e0012ab34cf",
            }
        }
    )

    id: str = Field(examples=["665f1df82c4a7e0012ab34cf"])


class DeleteResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "deleted",
                "entity": "student",
                "id": "665f1d8b2c4a7e0012ab34cd",
            }
        }
    )

    status: Literal["deleted"]
    entity: Literal["student", "course", "enrollment"]
    id: str


class SeedResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"message": "Database seeded successfully"}
        }
    )

    message: str


class HealthResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "service": "University API",
                "version": "0.1.0",
                "mongodb": "ok",
            }
        }
    )

    status: Literal["ok"]
    service: str
    version: str
    mongodb: Literal["ok"]


class WeatherResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "city": "Berlin",
                "temperature": 18,
                "condition": "Cloudy",
            }
        }
    )

    city: str
    temperature: int
    condition: str


class LoginUser(BaseModel):
    username: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "success",
                "token": "abc123xyz",
                "user": {"username": "demo_user"},
            }
        }
    )

    status: Literal["success"]
    token: str
    user: LoginUser


class UpdateResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"status": "updated"}}
    )

    status: Literal["updated"]
