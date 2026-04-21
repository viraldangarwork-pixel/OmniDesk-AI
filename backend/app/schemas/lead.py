from __future__ import annotations

from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.schemas.common import ORMModel, TimestampedOut


class LeadBase(ORMModel):
    contact_id: UUID
    title: str
    value: Optional[Decimal] = None
    currency: str = "USD"
    probability: int = 0
    source: Optional[str] = None
    description: Optional[str] = None
    custom: dict = {}


class LeadCreate(LeadBase):
    stage_code: Optional[str] = None
    owner_id: Optional[UUID] = None


class LeadUpdate(ORMModel):
    title: Optional[str] = None
    value: Optional[Decimal] = None
    currency: Optional[str] = None
    probability: Optional[int] = None
    source: Optional[str] = None
    description: Optional[str] = None
    stage_code: Optional[str] = None
    owner_id: Optional[UUID] = None
    custom: Optional[dict] = None


class LeadOut(LeadBase, TimestampedOut):
    owner_id: Optional[UUID] = None
    stage_id: Optional[UUID] = None


class StageOut(TimestampedOut):
    name: str
    code: str
    position: int = 0
    color: Optional[str] = None


class StageCreate(ORMModel):
    name: str
    code: str
    position: int = 0
    color: Optional[str] = None
