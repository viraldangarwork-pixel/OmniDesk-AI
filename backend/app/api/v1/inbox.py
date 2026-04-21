from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DbSession, TenantId, require_permissions
from app.models.conversation import ConversationStatus
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.inbox import (
    AssignRequest,
    CloseRequest,
    ConversationDetail,
    ConversationOut,
    MessageOut,
)
from app.services import inbox_service
from app.websocket.manager import manager

router = APIRouter()


def _conv_out(conv) -> ConversationOut:
    return ConversationOut.model_validate(conv)


def _conv_detail(conv) -> ConversationDetail:
    return ConversationDetail.model_validate(
        {
            **ConversationOut.model_validate(conv).model_dump(),
            "messages": [MessageOut.model_validate(m) for m in conv.messages],
        }
    )


@router.get(
    "",
    response_model=PaginatedResponse[ConversationOut],
    dependencies=[Depends(require_permissions("inbox.read"))],
)
async def list_conversations(
    db: DbSession,
    tenant_id: TenantId,
    pagination: Annotated[PaginationParams, Depends()],
    status: ConversationStatus | None = Query(default=None),
    assignee_id: UUID | None = Query(default=None),
    unassigned: bool = Query(default=False),
    q: str | None = Query(default=None),
) -> PaginatedResponse[ConversationOut]:
    items, total = await inbox_service.list_conversations(
        db, tenant_id, pagination, status, assignee_id, unassigned, q
    )
    return PaginatedResponse[ConversationOut](
        items=[_conv_out(c) for c in items],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.get(
    "/{conv_id}",
    response_model=ConversationDetail,
    dependencies=[Depends(require_permissions("inbox.read"))],
)
async def get_conversation(
    conv_id: UUID, db: DbSession, tenant_id: TenantId
) -> ConversationDetail:
    conv = await inbox_service.get_conversation(db, tenant_id, conv_id)
    return _conv_detail(conv)


@router.post(
    "/{conv_id}/assign",
    response_model=ConversationOut,
    dependencies=[Depends(require_permissions("inbox.write"))],
)
async def assign(
    conv_id: UUID,
    payload: AssignRequest,
    db: DbSession,
    tenant_id: TenantId,
) -> ConversationOut:
    conv = await inbox_service.assign_conversation(
        db, tenant_id, conv_id, payload.user_id
    )
    await manager.broadcast(
        tenant_id,
        "conversation:assigned",
        {"conversation_id": str(conv.id), "assignee_id": str(payload.user_id)},
    )
    return _conv_out(conv)


@router.post(
    "/{conv_id}/close",
    response_model=ConversationOut,
    dependencies=[Depends(require_permissions("inbox.write"))],
)
async def close(
    conv_id: UUID,
    payload: CloseRequest,
    db: DbSession,
    tenant_id: TenantId,
) -> ConversationOut:
    conv = await inbox_service.close_conversation(db, tenant_id, conv_id)
    await manager.broadcast(
        tenant_id,
        "conversation:update",
        {"conversation_id": str(conv.id), "status": conv.status.value},
    )
    return _conv_out(conv)
