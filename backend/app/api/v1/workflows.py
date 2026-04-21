from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.workflow import Workflow, WorkflowRun
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowOut,
    WorkflowRunOut,
    WorkflowRunRequest,
    WorkflowUpdate,
)

router = APIRouter(dependencies=[Depends(require_permissions("workflows.manage"))])


@router.get("", response_model=list[WorkflowOut])
async def list_workflows(db: DbSession, tenant_id: TenantId) -> list[WorkflowOut]:
    result = await db.execute(
        select(Workflow).where(Workflow.tenant_id == tenant_id).order_by(Workflow.created_at)
    )
    return [WorkflowOut.model_validate(w) for w in result.scalars().all()]


@router.post("", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    payload: WorkflowCreate, db: DbSession, tenant_id: TenantId
) -> WorkflowOut:
    wf = Workflow(tenant_id=tenant_id, **payload.model_dump())
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return WorkflowOut.model_validate(wf)


@router.put("/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: UUID,
    payload: WorkflowUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> WorkflowOut:
    wf = await db.get(Workflow, workflow_id)
    if not wf or wf.tenant_id != tenant_id:
        raise NotFound("Workflow not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(wf, k, v)
    await db.commit()
    await db.refresh(wf)
    return WorkflowOut.model_validate(wf)


@router.post("/run", response_model=WorkflowRunOut, status_code=status.HTTP_202_ACCEPTED)
async def run_workflow(
    payload: WorkflowRunRequest, db: DbSession, tenant_id: TenantId
) -> WorkflowRunOut:
    wf = await db.get(Workflow, payload.workflow_id)
    if not wf or wf.tenant_id != tenant_id:
        raise NotFound("Workflow not found")
    run = WorkflowRun(
        tenant_id=tenant_id,
        workflow_id=wf.id,
        status="queued",
        context=payload.context,
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    # Actual execution is dispatched to the Celery worker (workers/workflows.py).
    return WorkflowRunOut.model_validate(run)
