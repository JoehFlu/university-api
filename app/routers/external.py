from fastapi import APIRouter

from app.models import LoginResponse, UpdateResponse, WeatherResponse
from app.utils import call_castlemock


router = APIRouter(tags=["CastleMock"])


@router.get(
    "/external/weather",
    summary="Get mock weather from CastleMock",
    response_model=WeatherResponse,
    responses={502: {"description": "CastleMock is unavailable"}},
)
def get_mock_weather():
    return call_castlemock("GET", "x0T4QS/forecast")


@router.post(
    "/external/auth/login",
    summary="Mock user login via CastleMock",
    response_model=LoginResponse,
    responses={502: {"description": "CastleMock is unavailable"}},
)
def mock_login():
    return call_castlemock(
        "POST",
        "xpABue/auth",
        {"username": "demo_user", "password": "secret"},
    )


@router.put(
    "/external/user/update",
    summary="Mock user update via CastleMock",
    response_model=UpdateResponse,
    responses={502: {"description": "CastleMock is unavailable"}},
)
def update_user_profile():
    return call_castlemock("PUT", "kCpnzj/user/update")
