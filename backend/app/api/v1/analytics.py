from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.api.deps import DbSession, TenantId, require_permissions
from app.models.conversation import Conversation, ConversationStatus, Message
from app.models.lead import Lead
from app.models.metrics import DailyMetric

router = APIRouter(dependencies=[Depends(require_permissions("analytics.read"))])


@router.get("/summary")
async def summary(
    db: DbSession,
    tenant_id: TenantId,
    days: int = Query(default=30, ge=1, le=365),
):
    since = date.today() - timedelta(days=days)
    open_count = (
        await db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(
                Conversation.tenant_id == tenant_id,
                Conversation.status == ConversationStatus.open,
            )
        )
    ).scalar_one()
    msg_count = (
        await db.execute(
            select(func.count())
            .select_from(Message)
            .where(Message.tenant_id == tenant_id)
        )
    ).scalar_one()
    lead_count = (
        await db.execute(
            select(func.count())
            .select_from(Lead)
            .where(Lead.tenant_id == tenant_id)
        )
    ).scalar_one()

    return {
        "open_conversations": open_count,
        "total_messages": msg_count,
        "total_leads": lead_count,
        "since": since.isoformat(),
    }


@router.get("/daily")
async def daily(
    db: DbSession,
    tenant_id: TenantId,
    days: int = Query(default=30, ge=1, le=365),
):
    since = date.today() - timedelta(days=days)
    result = await db.execute(
        select(DailyMetric)
        .where(DailyMetric.tenant_id == tenant_id, DailyMetric.day >= since)
        .order_by(DailyMetric.day)
    )
    return [
        {
            "day": m.day.isoformat(),
            "conversations_opened": m.conversations_opened,
            "conversations_closed": m.conversations_closed,
            "messages_in": m.messages_in,
            "messages_out": m.messages_out,
            "ai_handled": m.ai_handled,
            "leads_created": m.leads_created,
            "leads_won": m.leads_won,
            "avg_first_response_seconds": m.avg_first_response_seconds,
        }
        for m in result.scalars().all()
    ]
