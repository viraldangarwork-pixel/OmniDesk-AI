from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import Conflict, NotFound
from app.core.security import hash_password
from app.models.user import Role, User, UserStatus
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter()


def _to_out(user: User) -> UserOut:
    return UserOut.model_validate(
        {
            "id": user.id,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "tenant_id": user.tenant_id,
            "status": user.status,
            "is_superuser": user.is_superuser,
            "roles": [r.code for r in user.roles],
        }
    )


async def _load_roles(db, tenant_id: UUID, codes: list[str]) -> list[Role]:
    if not codes:
        return []
    result = await db.execute(
        select(Role).where(Role.tenant_id == tenant_id, Role.code.in_(codes))
    )
    return list(result.scalars().all())


@router.get(
    "",
    response_model=PaginatedResponse[UserOut],
    dependencies=[Depends(require_permissions("users.read"))],
)
async def list_users(
    db: DbSession,
    tenant_id: TenantId,
    pagination: Annotated[PaginationParams, Depends()],
    q: str | None = Query(default=None),
) -> PaginatedResponse[UserOut]:
    stmt = (
        select(User)
        .where(User.tenant_id == tenant_id)
        .options(selectinload(User.roles))
        .order_by(User.created_at.desc())
    )
    count_stmt = select(func.count()).select_from(User).where(User.tenant_id == tenant_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((User.email.ilike(like)) | (User.full_name.ilike(like)))
        count_stmt = count_stmt.where(
            (User.email.ilike(like)) | (User.full_name.ilike(like))
        )
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.offset(pagination.offset).limit(pagination.size)
    users = (await db.execute(stmt)).scalars().all()
    return PaginatedResponse[UserOut](
        items=[_to_out(u) for u in users],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("users.write"))],
)
async def create_user(
    payload: UserCreate,
    db: DbSession,
    tenant_id: TenantId,
) -> UserOut:
    existing = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise Conflict("Email already in use")

    roles = await _load_roles(db, tenant_id, payload.role_codes)
    user = User(
        tenant_id=tenant_id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        status=UserStatus.active,
        roles=roles,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, ["roles"])
    return _to_out(user)


@router.put(
    "/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require_permissions("users.write"))],
)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> UserOut:
    result = await db.execute(
        select(User)
        .where(User.id == user_id, User.tenant_id == tenant_id)
        .options(selectinload(User.roles))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.status is not None:
        user.status = payload.status
    if payload.role_codes is not None:
        user.roles = await _load_roles(db, tenant_id, payload.role_codes)

    await db.commit()
    await db.refresh(user, ["roles"])
    return _to_out(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions("users.write"))],
)
async def delete_user(
    user_id: UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> None:
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")
    await db.delete(user)
    await db.commit()
