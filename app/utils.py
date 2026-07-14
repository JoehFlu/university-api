import logging

import requests
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.config import (
    CASTLEMOCK_BASE_URL,
    CASTLEMOCK_HEALTH_PATH,
    CASTLEMOCK_TIMEOUT_SECONDS,
)


logger = logging.getLogger(__name__)
http_session = requests.Session()


def parse_object_id(value: str, entity: str):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {entity} id") from exc


def to_out(doc, model):
    payload = {
        key: str(value) if isinstance(value, ObjectId) else value
        for key, value in doc.items()
        if key != "_id"
    }
    return model(id=str(doc["_id"]), **payload)


def call_castlemock(method: str, path: str, payload=None):
    url = f"{CASTLEMOCK_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        response = http_session.request(
            method,
            url,
            json=payload,
            timeout=CASTLEMOCK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, ValueError) as exc:
        logger.warning("CastleMock request failed: %s %s", method, path, exc_info=exc)
        raise HTTPException(
            status_code=502,
            detail="CastleMock is temporarily unavailable",
        ) from exc


def check_castlemock():
    response = call_castlemock("GET", CASTLEMOCK_HEALTH_PATH)
    if response.get("status") != "ok":
        raise HTTPException(status_code=502, detail="CastleMock health check failed")
    return {"status": "ok", "service": "CastleMock"}
