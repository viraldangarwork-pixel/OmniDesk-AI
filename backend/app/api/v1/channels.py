from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.channel import Channel
from app.schemas.channel import ChannelCreate, ChannelOut, ChannelUpdate

router = APIRouter(dependencies=[Depends(require_permissions("channels.manage"))])


@router.get("", response_model=list[ChannelOut])
async def list_channels(db: DbSession, tenant_id: TenantId) -> list[ChannelOut]:
    result = await db.execute(
        select(Channel).where(Channel.tenant_id == tenant_id).order_by(Channel.created_at)
    )
    return [ChannelOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
async def create_channel(
    payload: ChannelCreate, db: DbSession, tenant_id: TenantId
) -> ChannelOut:
    ch = Channel(tenant_id=tenant_id, **payload.model_dump())
    db.add(ch)
    await db.commit()
    await db.refresh(ch)
    return ChannelOut.model_validate(ch)


@router.put("/{channel_id}", response_model=ChannelOut)
async def update_channel(
    channel_id: UUID,
    payload: ChannelUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> ChannelOut:
    ch = await db.get(Channel, channel_id)
    if not ch or ch.tenant_id != tenant_id:
        raise NotFound("Channel not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ch, k, v)
    await db.commit()
    await db.refresh(ch)
    return ChannelOut.model_validate(ch)


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: UUID, db: DbSession, tenant_id: TenantId
) -> None:
    ch = await db.get(Channel, channel_id)
    if not ch or ch.tenant_id != tenant_id:
        raise NotFound("Channel not found")
    await db.delete(ch)
    await db.commit()
