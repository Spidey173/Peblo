import pytest
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings
from app.core.security import verify_password, get_password_hash


def test_signup_success(client):
    payload = {
        "email": "brandnew@peblo.app",
        "username": "newuser",
        "password": "Password123!",
        "full_name": "New User",
    }
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "brandnew@peblo.app"
    assert data["user"]["username"] == "newuser"


def test_signup_duplicate_email(client):
    payload = {
        "email": "dupe@peblo.app",
        "username": "user1",
        "password": "Password123!",
    }
    resp1 = client.post("/api/auth/signup", json=payload)
    assert resp1.status_code == 201

    payload2 = {
        "email": "dupe@peblo.app",
        "username": "user2",
        "password": "Password123!",
    }
    resp2 = client.post("/api/auth/signup", json=payload2)
    assert resp2.status_code == 400
    assert "Email already registered" in resp2.json()["detail"]


def test_signup_duplicate_username(client):
    payload1 = {
        "email": "unique1@peblo.app",
        "username": "sharedname",
        "password": "Password123!",
    }
    resp1 = client.post("/api/auth/signup", json=payload1)
    assert resp1.status_code == 201

    payload2 = {
        "email": "unique2@peblo.app",
        "username": "sharedname",
        "password": "Password123!",
    }
    resp2 = client.post("/api/auth/signup", json=payload2)
    assert resp2.status_code == 400
    assert "Username already taken" in resp2.json()["detail"]


def test_signup_short_password(client):
    payload = {
        "email": "short@peblo.app",
        "username": "shortuser",
        "password": "123",
    }
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 422


def test_login_success(client):
    signup_data = {
        "email": "login@peblo.app",
        "username": "loginuser",
        "password": "SecurePassword123!",
    }
    client.post("/api/auth/signup", json=signup_data)

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "login@peblo.app", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_login_wrong_password(client):
    signup_data = {
        "email": "wrongpass@peblo.app",
        "username": "wronguser",
        "password": "CorrectPassword123!",
    }
    client.post("/api/auth/signup", json=signup_data)

    resp = client.post(
        "/api/auth/login",
        json={"email": "wrongpass@peblo.app", "password": "WrongPassword123!"},
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]


def test_login_nonexistent_user(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "ghost@peblo.app", "password": "GhostPassword123!"},
    )
    assert resp.status_code == 401


def test_get_current_user_me(client, user_a_headers):
    resp = client.get("/api/auth/me", headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "user_a@peblo.app"
    assert data["username"] == "usera"


def test_jwt_expired_token(client):
    payload = {
        "sub": "some_user_id",
        "exp": datetime.utcnow() - timedelta(minutes=10),
    }
    expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    headers = {"Authorization": f"Bearer {expired_token}"}

    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 401


def test_jwt_invalid_signature(client):
    payload = {
        "sub": "some_user_id",
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    fake_token = jwt.encode(payload, "wrong-secret-key", algorithm=settings.ALGORITHM)
    headers = {"Authorization": f"Bearer {fake_token}"}

    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 401


def test_bcrypt_verification():
    raw_pass = "MySecretPass_456"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("wrong_password", hashed) is False

