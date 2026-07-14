from fastapi import APIRouter

from app.models import (
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    ProfileUpdateRequest,
    UpdateResponse,
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
    "/external/auth/login",
    summary="Mock user login via CastleMock",
    response_model=LoginResponse,
    responses={502: {"model": ErrorResponse, "description": "CastleMock is unavailable"}},
)
def mock_login(credentials: LoginRequest):
    return call_castlemock("POST", "xpABue/auth", credentials.model_dump())


@router.put(
    "/external/user/update",
    summary="Mock user update via CastleMock",
    response_model=UpdateResponse,
    responses={502: {"model": ErrorResponse, "description": "CastleMock is unavailable"}},
)
def update_user_profile(profile: ProfileUpdateRequest):
    return call_castlemock("PUT", "kCpnzj/user/update", profile.model_dump(exclude_unset=True))
