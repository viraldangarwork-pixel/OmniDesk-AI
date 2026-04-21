from __future__ import annotations

from typing import Optional

from pydantic import EmailStr

from app.schemas.common import ORMModel, TimestampedOut


class ContactBase(ORMModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    tags: list[str] = []
    custom: dict = {}


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ORMModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    tags: Optional[list[str]] = None
    custom: Optional[dict] = None


class ContactOut(ContactBase, TimestampedOut):
    avatar_url: Optional[str] = None
