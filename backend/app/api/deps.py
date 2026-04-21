from __future__ import annotations

from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import Forbidden, Unauthorized
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
) -> User:
    if not token:
        raise Unauthorized("Missing token")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Token expired")
    except jwt.PyJWTError:
        raise Unauthorized("Invalid token")

    if payload.get("type") != "access":
        raise Unauthorized("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise Unauthorized("Invalid token subject")

    result = await db.execute(
        select(User)
        .where(User.id == UUID(user_id))
        .options(selectinload(User.roles))
    )
    user = result.scalar_one_or_none()
    if not user or user.status.value == "disabled":
        raise Unauthorized("User not available")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_tenant_id(
    user: CurrentUser,
    x_tenant_id: Annotated[str | None, Header(alias="X-Tenant-Id")] = None,
) -> UUID:
    if user.is_superuser and x_tenant_id:
        return UUID(x_tenant_id)
    if not user.tenant_id:
        raise Forbidden("Tenant context required")
    return user.tenant_id


TenantId = Annotated[UUID, Depends(get_tenant_id)]


def require_permissions(*codes: str):
    async def _check(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        user_perms: set[str] = set()
        for role in user.roles:
            for perm in role.permissions:
                user_perms.add(perm.code)
        missing = [c for c in codes if c not in user_perms]
        if missing:
            raise Forbidden(f"Missing permissions: {', '.join(missing)}")
        return user

    return _check


def require_role(*role_codes: str):
    async def _check(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        my_roles = {r.code for r in user.roles}
        if not my_roles.intersection(role_codes):
            raise Forbidden(f"Requires role: {', '.join(role_codes)}")
        return user

    return _check
