from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFound
from app.models.conversation import (
    Conversation,
    ConversationStatus,
    Message,
    MessageDirection,
    MessageSender,
)
from app.schemas.common import PaginationParams
from app.schemas.inbox import MessageCreate


async def list_conversations(
    db: AsyncSession,
    tenant_id: UUID,
    pagination: PaginationParams,
    status_filter: ConversationStatus | None = None,
    assignee_id: UUID | None = None,
    unassigned: bool = False,
    q: str | None = None,
) -> tuple[list[Conversation], int]:
    base = select(Conversation).where(Conversation.tenant_id == tenant_id)
    count_stmt = (
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.tenant_id == tenant_id)
    )
    if status_filter:
        base = base.where(Conversation.status == status_filter)
        count_stmt = count_stmt.where(Conversation.status == status_filter)
    if assignee_id:
        base = base.where(Conversation.assignee_id == assignee_id)
        count_stmt = count_stmt.where(Conversation.assignee_id == assignee_id)
    if unassigned:
        base = base.where(Conversation.assignee_id.is_(None))
        count_stmt = count_stmt.where(Conversation.assignee_id.is_(None))
    if q:
        like = f"%{q}%"
        base = base.where(Conversation.subject.ilike(like))
        count_stmt = count_stmt.where(Conversation.subject.ilike(like))

    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        base.order_by(Conversation.last_message_at.desc().nullslast())
        .offset(pagination.offset)
        .limit(pagination.size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return items, total


async def get_conversation(
    db: AsyncSession, tenant_id: UUID, conv_id: UUID
) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id, Conversation.tenant_id == tenant_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFound("Conversation not found")
    return conv


async def assign_conversation(
    db: AsyncSession, tenant_id: UUID, conv_id: UUID, user_id: UUID
) -> Conversation:
    conv = await get_conversation(db, tenant_id, conv_id)
    conv.assignee_id = user_id
    await db.commit()
    await db.refresh(conv)
    return conv


async def close_conversation(
    db: AsyncSession, tenant_id: UUID, conv_id: UUID
) -> Conversation:
    conv = await get_conversation(db, tenant_id, conv_id)
    conv.status = ConversationStatus.closed
    await db.commit()
    await db.refresh(conv)
    return conv


async def send_message(
    db: AsyncSession,
    tenant_id: UUID,
    payload: MessageCreate,
    sender_user_id: UUID,
) -> Message:
    conv = await get_conversation(db, tenant_id, payload.conversation_id)
    msg = Message(
        tenant_id=tenant_id,
        conversation_id=conv.id,
        sender_type=payload.sender_type,
        sender_id=sender_user_id,
        direction=MessageDirection.outbound,
        content=payload.content,
        content_type=payload.content_type,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    if conv.status == ConversationStatus.closed:
        conv.status = ConversationStatus.open
    await db.commit()
    await db.refresh(msg, ["attachments"])
    return msg
