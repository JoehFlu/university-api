from fastapi.testclient import TestClient
import pytest

from app.routers import external as external_router
from app.app import app
from app.db import courses, enrollments, students


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_database(client):
    enrollments.delete_many({})
    students.delete_many({})
    courses.delete_many({})
    yield
    enrollments.delete_many({})
    students.delete_many({})
    courses.delete_many({})


def create_student(client: TestClient, email: str = "student@example.com") -> dict:
    response = client.post(
        "/students",
        json={"name": "Test Student", "age": 20, "email": email},
    )
    assert response.status_code == 201
    return response.json()


def create_course(client: TestClient) -> dict:
    response = client.post(
        "/courses",
        json={"title": "Reliable Systems", "description": "Failure handling"},
    )
    assert response.status_code == 201
    return response.json()


def test_health_reports_database(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["mongodb"] == "ok"
    assert response.json()["castlemock"] in {"ok", "unavailable"}
    assert response.json()["status"] in {"ok", "degraded"}


def test_patch_rejects_explicit_null(client: TestClient):
    student = create_student(client)
    response = client.patch(f"/students/{student['id']}", json={"name": None})
    assert response.status_code == 422
    assert client.get(f"/students/{student['id']}").json()["name"] == "Test Student"


def test_email_is_case_insensitive(client: TestClient):
    create_student(client, "Student@Example.com")
    response = client.post(
        "/students",
        json={"name": "Duplicate", "age": 21, "email": "student@example.com"},
    )
    assert response.status_code == 409


def test_deleting_student_removes_enrollments_atomically(client: TestClient):
    student = create_student(client)
    course = create_course(client)
    enrollment = client.post(
        "/enrollments",
        json={"student_id": student["id"], "course_id": course["id"]},
    )
    assert enrollment.status_code == 201

    assert client.delete(f"/students/{student['id']}").status_code == 200
    assert client.get("/enrollments").json() == []


def test_deleting_course_removes_enrollments_atomically(client: TestClient):
    student = create_student(client)
    course = create_course(client)
    enrollment = client.post(
        "/enrollments",
        json={"student_id": student["id"], "course_id": course["id"]},
    )
    assert enrollment.status_code == 201

    assert client.delete(f"/courses/{course['id']}").status_code == 200
    assert client.get("/enrollments").json() == []


def test_duplicate_enrollment_returns_conflict(client: TestClient):
    student = create_student(client)
    course = create_course(client)
    payload = {"student_id": student["id"], "course_id": course["id"]}
    assert client.post("/enrollments", json=payload).status_code == 201
    assert client.post("/enrollments", json=payload).status_code == 409


def test_seed_replaces_all_data(client: TestClient):
    create_student(client)
    response = client.post("/seed")
    assert response.status_code == 200
    assert len(client.get("/students").json()) == 10
    assert len(client.get("/courses").json()) == 3
    assert len(client.get("/enrollments").json()) == 10


def test_list_pagination_is_stable(client: TestClient):
    for index in range(3):
        create_student(client, f"student{index}@example.com")
    first_page = client.get("/students", params={"offset": 0, "limit": 2})
    second_page = client.get("/students", params={"offset": 2, "limit": 2})
    assert first_page.status_code == 200
    assert second_page.status_code == 200
    assert len(first_page.json()) == 2
    assert len(second_page.json()) == 1
    assert first_page.json()[-1]["id"] != second_page.json()[0]["id"]


def test_student_verification_forwards_student_to_castlemock(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    student = create_student(client)
    captured = {}

    def fake_call(method: str, path: str, payload=None):
        captured.update(method=method, path=path, payload=payload)
        return {
            "status": "verified",
            "reference_id": "VER-1024",
            "provider": "StudentCheck",
        }

    monkeypatch.setattr(external_router, "call_castlemock", fake_call)
    response = client.post(
        "/external/student-verification",
        json={
            "student_id": student["id"],
            "name": student["name"],
            "email": student["email"],
        },
    )

    assert response.status_code == 200
    assert response.json()["reference_id"] == "VER-1024"
    assert captured == {
        "method": "POST",
        "path": "vEr1Fy/students/verify",
        "payload": {
            "student_id": student["id"],
            "name": student["name"],
            "email": student["email"],
        },
    }


def test_enrollment_notification_forwards_context_to_castlemock(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    student = create_student(client)
    course = create_course(client)
    enrollment = client.post(
        "/enrollments",
        json={"student_id": student["id"], "course_id": course["id"]},
    ).json()
    captured = {}

    def fake_call(method: str, path: str, payload=None):
        captured.update(method=method, path=path, payload=payload)
        return {"status": "sent", "message_id": "MSG-2048", "channel": "email"}

    monkeypatch.setattr(external_router, "call_castlemock", fake_call)
    payload = {
        "enrollment_id": enrollment["id"],
        "student_name": student["name"],
        "email": student["email"],
        "course_title": course["title"],
    }
    response = client.post("/external/enrollment-notification", json=payload)

    assert response.status_code == 200
    assert response.json()["message_id"] == "MSG-2048"
    assert captured == {
        "method": "POST",
        "path": "nOt1Fy/notifications/enrollment",
        "payload": payload,
    }


def test_openapi_exposes_only_current_castlemock_operations(client: TestClient):
    paths = client.get("/openapi.json").json()["paths"]

    assert "/external/weather" in paths
    assert "/external/student-verification" in paths
    assert "/external/enrollment-notification" in paths
    assert "/external/auth/login" not in paths
    assert "/external/user/update" not in paths
