from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedResponse(ORMModel, Generic[T]):
    items: list[T]
    total: int
    page: int = 1
    size: int = 20


class IdResponse(ORMModel):
    id: UUID


class TimestampedOut(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
