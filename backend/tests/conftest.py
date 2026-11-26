import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from alembic import command
from alembic.config import Config

# Ensure backend directory is in path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)

from app.main import app  # noqa: E402
from app.db.database import get_db, normalize_postgres_url  # noqa: E402

RAW_TEST_DB_URL = (
    os.environ.get("TEST_DATABASE_URL")
    or os.environ.get("DATABASE_URL")
    or "postgresql+psycopg://peblo:peblo@localhost:5432/peblo"
)
TEST_DATABASE_URL = normalize_postgres_url(RAW_TEST_DB_URL)

engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)


@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    """Verify Alembic migrations apply cleanly from an empty schema once per test session."""
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))

    alembic_cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    os.environ["DIRECT_URL"] = TEST_DATABASE_URL
    command.upgrade(alembic_cfg, "head")
    yield
    engine.dispose()


@pytest.fixture
def db_session():
    """Provide a transactional DB session rolled back after each test via SAVEPOINT."""
    connection = engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=connection,
        join_transaction_mode="create_savepoint",
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a_headers(client):
    signup_data = {
        "email": "user_a@peblo.app",
        "username": "usera",
        "password": "Password123!",
        "full_name": "User Alpha",
    }
    resp = client.post("/api/auth/signup", json=signup_data)
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_b_headers(client):
    signup_data = {
        "email": "user_b@peblo.app",
        "username": "userb",
        "password": "Password123!",
        "full_name": "User Beta",
    }
    resp = client.post("/api/auth/signup", json=signup_data)
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
