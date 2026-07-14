from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    WithJsonSchema,
    model_validator,
)


ObjectIdStr = Annotated[
    str,
    WithJsonSchema(
        {
            "type": "string",
            "pattern": "^[a-fA-F0-9]{24}$",
            "minLength": 24,
            "maxLength": 24,
        }
    ),
]


class ErrorResponse(BaseModel):
    """A consistent error body returned by application endpoints."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"detail": "Student not found"}}
    )

    detail: str


class StudentFields(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100, examples=["Ivan Petrov"])
    age: int = Field(ge=16, le=120, examples=[21])
    email: EmailStr = Field(examples=["ivan.petrov@example.com"])


class StudentCreate(StudentFields):
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


class StudentUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    age: int | None = Field(default=None, ge=16, le=120)
    email: EmailStr | None = None

    @model_validator(mode="after")
    def requires_a_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class StudentResponse(StudentFields):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "665f1d8b2c4a7e0012ab34cd",
                "name": "Ivan Petrov",
                "age": 21,
                "email": "ivan.petrov@example.com",
            }
        }
    )

    id: ObjectIdStr


class CourseFields(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200, examples=["Introduction to Python"])
    description: str = Field(
        min_length=1,
        max_length=2000,
        examples=["Python fundamentals for beginners"],
    )


class CourseCreate(CourseFields):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "title": "Introduction to Python",
                "description": "Python fundamentals for beginners",
            }
        },
    )


class CourseUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=2000)

    @model_validator(mode="after")
    def requires_a_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class CourseResponse(CourseFields):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "665f1dc62c4a7e0012ab34ce",
                "title": "Introduction to Python",
                "description": "Python fundamentals for beginners",
            }
        }
    )

    id: ObjectIdStr


class EnrollmentCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "665f1d8b2c4a7e0012ab34cd",
                "course_id": "665f1dc62c4a7e0012ab34ce",
            }
        }
    )

    student_id: ObjectIdStr
    course_id: ObjectIdStr


class EnrollmentUpdate(BaseModel):
    student_id: ObjectIdStr | None = None
    course_id: ObjectIdStr | None = None

    @model_validator(mode="after")
    def requires_a_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class EnrollmentResponse(EnrollmentCreate):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "665f1df82c4a7e0012ab34cf",
                "student_id": "665f1d8b2c4a7e0012ab34cd",
                "course_id": "665f1dc62c4a7e0012ab34ce",
                "enrolled_at": "2026-06-21T18:00:00Z",
            }
        }
    )

    id: ObjectIdStr
    enrolled_at: datetime | None = Field(default=None)


class DeleteResponse(BaseModel):
    status: Literal["deleted"]
    entity: Literal["student", "course", "enrollment"]
    id: ObjectIdStr


class SeedResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    mongodb: Literal["ok"]


class WeatherResponse(BaseModel):
    city: str
    temperature: int
    condition: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100, examples=["demo_user"])
    password: str = Field(min_length=1, max_length=100, examples=["secret"])


class LoginUser(BaseModel):
    username: str


class LoginResponse(BaseModel):
    status: Literal["success"]
    token: str
    user: LoginUser


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None

    @model_validator(mode="after")
    def requires_a_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class UpdateResponse(BaseModel):
    status: Literal["updated"]
