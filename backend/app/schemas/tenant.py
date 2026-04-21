from __future__ import annotations

from typing import Optional

from pydantic import Field

from app.models.tenant import TenantStatus
from app.schemas.common import ORMModel, TimestampedOut


class TenantBase(ORMModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=128, pattern=r"^[a-z0-9-]+$")
    domain: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(ORMModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    settings: Optional[dict] = None


class TenantOut(TenantBase, TimestampedOut):
    status: TenantStatus
    settings: dict = {}
