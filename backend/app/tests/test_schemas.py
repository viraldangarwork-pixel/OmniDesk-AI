from __future__ import annotations

import pytest

from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.common import PaginationParams


def test_register_validates_slug() -> None:
    with pytest.raises(ValueError):
        RegisterRequest(
            tenant_name="Acme",
            tenant_slug="Invalid Slug!",
            email="a@b.com",
            password="password123",
        )


def test_login_accepts_valid_email() -> None:
    req = LoginRequest(email="user@example.com", password="password123")
    assert str(req.email) == "user@example.com"


def test_pagination_offset() -> None:
    p = PaginationParams(page=3, size=10)
    assert p.offset == 20
