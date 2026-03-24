import asyncio
from datetime import timedelta
from types import SimpleNamespace

import pytest
from jose import jwt
from fastapi import HTTPException

from app.auth import (
    create_access_token,
    get_current_active_user,
    get_password_hash,
    require_role,
    verify_password,
)
from app.config import settings


def test_password_hash_and_verify_roundtrip() -> None:
    password = "StrongPass#123"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong-password", hashed)


def test_create_access_token_serializes_subject_and_exp() -> None:
    token = create_access_token(
        {"sub": 42, "role": "founder"},
        expires_delta=timedelta(minutes=5),
    )
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == "42"
    assert payload["role"] == "founder"
    assert "exp" in payload


def test_get_current_active_user_rejects_inactive_user() -> None:
    inactive_user = SimpleNamespace(is_active=False)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_current_active_user(inactive_user))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Inactive user"


def test_require_role_rejects_wrong_role() -> None:
    role_checker = require_role("admin")
    founder = SimpleNamespace(role="founder", is_active=True)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(role_checker(founder))

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not enough permissions"


def test_require_role_accepts_allowed_role() -> None:
    role_checker = require_role("admin", "mentor")
    mentor = SimpleNamespace(role="mentor", is_active=True)

    resolved_user = asyncio.run(role_checker(mentor))

    assert resolved_user is mentor
