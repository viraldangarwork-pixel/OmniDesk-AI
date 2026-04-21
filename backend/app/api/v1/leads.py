from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.lead import Lead, LeadStage
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.lead import (
    LeadCreate,
    LeadOut,
    LeadUpdate,
    StageCreate,
    StageOut,
)

router = APIRouter(dependencies=[Depends(require_permissions("leads.manage"))])


async def _stage_by_code(db, tenant_id: UUID, code: str | None) -> LeadStage | None:
    if not code:
        return None
    result = await db.execute(
        select(LeadStage).where(
            LeadStage.tenant_id == tenant_id, LeadStage.code == code
        )
    )
    return result.scalar_one_or_none()


@router.get("/stages", response_model=list[StageOut])
async def list_stages(db: DbSession, tenant_id: TenantId) -> list[StageOut]:
    result = await db.execute(
        select(LeadStage)
        .where(LeadStage.tenant_id == tenant_id)
        .order_by(LeadStage.position)
    )
    return [StageOut.model_validate(s) for s in result.scalars().all()]


@router.post("/stages", response_model=StageOut, status_code=status.HTTP_201_CREATED)
async def create_stage(
    payload: StageCreate, db: DbSession, tenant_id: TenantId
) -> StageOut:
    stage = LeadStage(tenant_id=tenant_id, **payload.model_dump())
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return StageOut.model_validate(stage)


@router.get("", response_model=PaginatedResponse[LeadOut])
async def list_leads(
    db: DbSession,
    tenant_id: TenantId,
    pagination: Annotated[PaginationParams, Depends()],
    stage_id: UUID | None = Query(default=None),
    owner_id: UUID | None = Query(default=None),
) -> PaginatedResponse[LeadOut]:
    base = select(Lead).where(Lead.tenant_id == tenant_id)
    count_stmt = (
        select(func.count()).select_from(Lead).where(Lead.tenant_id == tenant_id)
    )
    if stage_id:
        base = base.where(Lead.stage_id == stage_id)
        count_stmt = count_stmt.where(Lead.stage_id == stage_id)
    if owner_id:
        base = base.where(Lead.owner_id == owner_id)
        count_stmt = count_stmt.where(Lead.owner_id == owner_id)
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        base.order_by(Lead.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse[LeadOut](
        items=[LeadOut.model_validate(l) for l in items],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate, db: DbSession, tenant_id: TenantId
) -> LeadOut:
    data = payload.model_dump(exclude={"stage_code"})
    stage = await _stage_by_code(db, tenant_id, payload.stage_code)
    lead = Lead(tenant_id=tenant_id, stage_id=stage.id if stage else None, **data)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> LeadOut:
    lead = await db.get(Lead, lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFound("Lead not found")
    data = payload.model_dump(exclude_unset=True)
    if "stage_code" in data:
        stage = await _stage_by_code(db, tenant_id, data.pop("stage_code"))
        lead.stage_id = stage.id if stage else None
    for k, v in data.items():
        setattr(lead, k, v)
    await db.commit()
    await db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: UUID, db: DbSession, tenant_id: TenantId) -> None:
    lead = await db.get(Lead, lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFound("Lead not found")
    await db.delete(lead)
    await db.commit()
