import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import APP_TITLE, APP_VERSION, TAGS_METADATA
from app.db import client, ensure_indexes
from app.routers import courses, enrollments, external, students, utility


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_indexes()
    yield
    client.close()


app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
)

app.include_router(utility.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(external.router)


@app.exception_handler(PyMongoError)
async def mongodb_error_handler(_: Request, exc: PyMongoError):
    logger.exception("MongoDB operation failed", exc_info=exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is temporarily unavailable"},
    )
