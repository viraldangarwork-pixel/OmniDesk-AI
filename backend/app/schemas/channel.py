from __future__ import annotations

from typing import Optional

from app.models.channel import ChannelType
from app.schemas.common import ORMModel, TimestampedOut


class ChannelBase(ORMModel):
    type: ChannelType
    name: str
    external_id: Optional[str] = None
    config: dict = {}


class ChannelCreate(ChannelBase):
    credentials: dict = {}


class ChannelUpdate(ORMModel):
    name: Optional[str] = None
    external_id: Optional[str] = None
    config: Optional[dict] = None
    credentials: Optional[dict] = None
    active: Optional[bool] = None


class ChannelOut(ChannelBase, TimestampedOut):
    active: bool = True
