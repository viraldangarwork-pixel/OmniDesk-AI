from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import Conflict, Unauthorized
from app.core.security import create_token, hash_password, verify_password
from app.models.tenant import Tenant, TenantStatus
from app.models.user import Permission, Role, User, UserStatus
from app.schemas.auth import (
    AuthenticatedUser,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenPair,
)

OWNER_ROLE_CODE = "owner"
DEFAULT_PERMISSIONS: list[tuple[str, str]] = [
    ("tenants.manage", "Manage tenant settings"),
    ("users.read", "Read users"),
    ("users.write", "Create/update/delete users"),
    ("roles.manage", "Manage roles and permissions"),
    ("channels.manage", "Manage channels"),
    ("inbox.read", "Read conversations"),
    ("inbox.write", "Send and manage messages"),
    ("contacts.manage", "Manage contacts"),
    ("leads.manage", "Manage leads"),
    ("ai.manage", "Manage AI agents"),
    ("kb.manage", "Manage knowledge base"),
    ("workflows.manage", "Manage workflows"),
    ("analytics.read", "View analytics"),
    ("billing.manage", "Manage billing"),
]


async def _ensure_permissions(db: AsyncSession) -> list[Permission]:
    result = await db.execute(select(Permission))
    existing = {p.code: p for p in result.scalars().all()}
    created: list[Permission] = []
    for code, desc in DEFAULT_PERMISSIONS:
        if code not in existing:
            perm = Permission(code=code, description=desc)
            db.add(perm)
            created.append(perm)
    if created:
        await db.flush()
    result = await db.execute(select(Permission))
    return list(result.scalars().all())


async def _make_owner_role(db: AsyncSession, tenant_id: UUID) -> Role:
    perms = await _ensure_permissions(db)
    role = Role(
        tenant_id=tenant_id,
        name="Owner",
        code=OWNER_ROLE_CODE,
        description="Full tenant administrator",
        permissions=perms,
    )
    db.add(role)
    await db.flush()
    return role


def _tokens_for(user: User) -> TokenPair:
    extra = {"tenant_id": str(user.tenant_id) if user.tenant_id else None}
    return TokenPair(
        access_token=create_token(user.id, "access", extra),
        refresh_token=create_token(user.id, "refresh"),
    )


def _user_out(user: User) -> AuthenticatedUser:
    role_codes = [r.code for r in user.roles]
    perms: set[str] = set()
    for r in user.roles:
        for p in r.permissions:
            perms.add(p.code)
    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        tenant_id=user.tenant_id,
        is_superuser=user.is_superuser,
        roles=role_codes,
        permissions=sorted(perms),
    )


async def register(db: AsyncSession, req: RegisterRequest) -> AuthResponse:
    existing = await db.execute(select(Tenant).where(Tenant.slug == req.tenant_slug))
    if existing.scalar_one_or_none():
        raise Conflict("Tenant slug already taken")

    tenant = Tenant(
        name=req.tenant_name,
        slug=req.tenant_slug,
        status=TenantStatus.trialing,
    )
    db.add(tenant)
    await db.flush()

    role = await _make_owner_role(db, tenant.id)

    existing_user = await db.execute(
        select(User).where(User.tenant_id == tenant.id, User.email == req.email)
    )
    if existing_user.scalar_one_or_none():
        raise Conflict("Email already in use")

    user = User(
        tenant_id=tenant.id,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        status=UserStatus.active,
        roles=[role],
    )
    db.add(user)
    await db.commit()

    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
    )
    user = result.scalar_one()
    return AuthResponse(user=_user_out(user), tokens=_tokens_for(user))


async def login(db: AsyncSession, req: LoginRequest) -> AuthResponse:
    result = await db.execute(
        select(User)
        .where(User.email == req.email)
        .options(selectinload(User.roles).selectinload(Role.permissions))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise Unauthorized("Invalid credentials")
    if user.status == UserStatus.disabled:
        raise Unauthorized("Account disabled")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    return AuthResponse(user=_user_out(user), tokens=_tokens_for(user))


async def refresh(db: AsyncSession, user_id: UUID) -> TokenPair:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise Unauthorized("User not found")
    return _tokens_for(user)


async def me(db: AsyncSession, user_id: UUID) -> AuthenticatedUser:
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise Unauthorized("User not found")
    return _user_out(user)
