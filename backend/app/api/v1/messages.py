from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, TenantId, require_permissions
from app.schemas.inbox import MessageCreate, MessageOut
from app.services import inbox_service
from app.websocket.manager import manager

router = APIRouter()


@router.post(
    "/send",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("inbox.write"))],
)
async def send_message(
    payload: MessageCreate,
    user: CurrentUser,
    db: DbSession,
    tenant_id: TenantId,
) -> MessageOut:
    msg = await inbox_service.send_message(db, tenant_id, payload, user.id)
    out = MessageOut.model_validate(msg)
    await manager.broadcast(tenant_id, "message:new", out.model_dump())
    return out
