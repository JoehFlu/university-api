from fastapi import APIRouter

from app.models import (
    EnrollmentNotificationRequest,
    EnrollmentNotificationResponse,
    ErrorResponse,
    StudentVerificationRequest,
    StudentVerificationResponse,
    WeatherResponse,
)
from app.utils import call_castlemock


router = APIRouter(tags=["CastleMock"])


@router.get(
    "/external/weather",
    summary="Get mock weather from CastleMock",
    response_model=WeatherResponse,
    responses={502: {"model": ErrorResponse, "description": "CastleMock is unavailable"}},
)
def get_mock_weather():
    return call_castlemock("GET", "x0T4QS/forecast")


@router.post(
    "/external/student-verification",
    summary="Verify a student via CastleMock",
    response_model=StudentVerificationResponse,
    responses={502: {"model": ErrorResponse, "description": "CastleMock is unavailable"}},
)
def verify_student(student: StudentVerificationRequest):
    return call_castlemock(
        "POST",
        "vEr1Fy/students/verify",
        student.model_dump(mode="json"),
    )


@router.post(
    "/external/enrollment-notification",
    summary="Send an enrollment notification via CastleMock",
    response_model=EnrollmentNotificationResponse,
    responses={502: {"model": ErrorResponse, "description": "CastleMock is unavailable"}},
)
def send_enrollment_notification(notification: EnrollmentNotificationRequest):
    return call_castlemock(
        "POST",
        "nOt1Fy/notifications/enrollment",
        notification.model_dump(mode="json"),
    )
