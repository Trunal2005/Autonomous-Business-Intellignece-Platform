"""Pytest fixtures for the backend API tests."""

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]

# Keep tests deterministic/fast: never call a live LLM during the test suite,
# even if backend/.env enables the assistant.
os.environ["ENABLE_LLM_ASSISTANT"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from tests.database_fixture import test_storage, seed_synthetic_warehouse  # noqa: E402


def pytest_addoption(parser):
    parser.addoption('--reference-db', default=None, help='Optional read-only Olist warehouse snapshot for baseline regressions.')


def pytest_configure(config):
    storage = test_storage(config.getoption('--reference-db'))
    path = storage.__enter__()
    config._sem5_storage = storage
    config._sem5_test_database = path
    os.environ['DATABASE_URL'] = f'sqlite:///{path.as_posix()}'
    os.environ['AUTH_ADMIN_PASSWORD'] = 'admin123'
    os.environ['AUTH_ANALYST_PASSWORD'] = 'analyst123'
    from app.database.session import engine
    if not config.getoption('--reference-db'):
        seed_synthetic_warehouse(engine)


def pytest_unconfigure(config):
    if hasattr(config, '_sem5_storage'):
        from app.database.session import engine
        engine.dispose()
        config._sem5_storage.__exit__(None, None, None)


@pytest.fixture(scope="session")
def client() -> TestClient:
    from app.main import app
    return TestClient(app)


def _warehouse_count(table: str) -> int:
    from sqlalchemy import inspect, text

    from app.database.session import engine

    insp = inspect(engine)
    if table not in insp.get_table_names():
        return 0
    with engine.connect() as conn:
        return int(conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0)


@pytest.fixture(scope="session")
def warehouse_ready(request) -> bool:
    return bool(request.config.getoption('--reference-db')) and _warehouse_count("fact_orders") > 0


def _token(client: TestClient, username: str, password: str) -> str:
    r = client.post("/api/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client: TestClient) -> str:
    return _token(client, "admin", "admin123")


@pytest.fixture(scope="session")
def analyst_token(client: TestClient) -> str:
    return _token(client, "analyst", "analyst123")


@pytest.fixture()
def auth(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def analyst_auth(analyst_token: str) -> dict:
    return {"Authorization": f"Bearer {analyst_token}"}
