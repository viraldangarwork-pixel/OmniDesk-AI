from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from app.models.user import UserStatus
from app.schemas.common import ORMModel, TimestampedOut


class UserBase(ORMModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    role_codes: list[str] = Field(default_factory=list)


class UserUpdate(ORMModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None
    role_codes: Optional[list[str]] = None


class UserOut(UserBase, TimestampedOut):
    tenant_id: Optional[UUID] = None
    status: UserStatus
    is_superuser: bool = False
    roles: list[str] = []


class RoleOut(TimestampedOut):
    name: str
    code: str
    description: Optional[str] = None
    permissions: list[str] = []


class RoleCreate(ORMModel):
    name: str
    code: str
    description: Optional[str] = None
    permission_codes: list[str] = Field(default_factory=list)
