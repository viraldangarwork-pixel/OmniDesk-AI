from __future__ import annotations

import pytest

from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_roundtrip() -> None:
    hashed = hash_password("supersecret")
    assert verify_password("supersecret", hashed)
    assert not verify_password("wrong", hashed)


def test_token_roundtrip() -> None:
    token = create_token("user-123", "access", {"tenant_id": "abc"})
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"
    assert payload["tenant_id"] == "abc"


def test_refresh_token_type() -> None:
    token = create_token("user-1", "refresh")
    payload = decode_token(token)
    assert payload["type"] == "refresh"
