from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.models.conversation import (
    ConversationStatus,
    MessageDirection,
    MessageSender,
)
from app.schemas.common import ORMModel, TimestampedOut


class MessageAttachmentOut(ORMModel):
    id: UUID
    url: str
    filename: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None


class MessageOut(TimestampedOut):
    conversation_id: UUID
    sender_type: MessageSender
    sender_id: Optional[UUID] = None
    direction: MessageDirection
    content: Optional[str] = None
    content_type: str = "text"
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    attachments: list[MessageAttachmentOut] = []
    meta: dict = {}


class MessageCreate(ORMModel):
    conversation_id: UUID
    content: str = Field(min_length=1)
    content_type: str = "text"
    sender_type: MessageSender = MessageSender.agent


class ConversationOut(TimestampedOut):
    tenant_id: UUID
    channel_id: UUID
    contact_id: UUID
    assignee_id: Optional[UUID] = None
    status: ConversationStatus
    subject: Optional[str] = None
    unread_count: int = 0
    last_message_at: Optional[datetime] = None
    tags: list = []


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = []


class AssignRequest(ORMModel):
    user_id: UUID


class CloseRequest(ORMModel):
    reason: Optional[str] = None
