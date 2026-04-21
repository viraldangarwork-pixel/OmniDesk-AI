from __future__ import annotations

from uuid import UUID

import jwt
from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import Unauthorized
from app.core.security import decode_token
from app.schemas.auth import (
    AuthResponse,
    AuthenticatedUser,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    return await auth_service.register(db, payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    return await auth_service.login(db, payload)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    try:
        data = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise Unauthorized("Invalid refresh token")
    if data.get("type") != "refresh":
        raise Unauthorized("Not a refresh token")
    return await auth_service.refresh(db, UUID(data["sub"]))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user: CurrentUser) -> None:
    # Stateless JWT — client discards tokens. Token blocklist can be added later.
    return None


@router.get("/me", response_model=AuthenticatedUser)
async def me(user: CurrentUser, db: DbSession) -> AuthenticatedUser:
    return await auth_service.me(db, user.id)
