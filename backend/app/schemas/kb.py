from __future__ import annotations

from typing import Optional

from pydantic import Field

from app.schemas.common import ORMModel, TimestampedOut


class KBDocOut(TimestampedOut):
    title: str
    source_type: str
    source_url: Optional[str] = None
    status: str
    meta: dict = {}


class KBUrlIngest(ORMModel):
    url: str = Field(min_length=5)
    title: Optional[str] = None


class KBChunkOut(ORMModel):
    id: str
    content: str
    score: float = 0.0


class KBSearchResponse(ORMModel):
    query: str
    results: list[KBChunkOut] = []
