from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.ai_agent import AIAgent
from app.schemas.ai import (
    AIAgentCreate,
    AIAgentOut,
    AIAgentUpdate,
    ReplyRequest,
    ReplyResponse,
    RouteRequest,
    RouteResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services import ai_service

router = APIRouter()


@router.get(
    "/agents",
    response_model=list[AIAgentOut],
    dependencies=[Depends(require_permissions("ai.manage"))],
)
async def list_agents(db: DbSession, tenant_id: TenantId) -> list[AIAgentOut]:
    result = await db.execute(
        select(AIAgent).where(AIAgent.tenant_id == tenant_id).order_by(AIAgent.created_at)
    )
    return [AIAgentOut.model_validate(a) for a in result.scalars().all()]


@router.post(
    "/agents",
    response_model=AIAgentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("ai.manage"))],
)
async def create_agent(
    payload: AIAgentCreate, db: DbSession, tenant_id: TenantId
) -> AIAgentOut:
    agent = AIAgent(tenant_id=tenant_id, **payload.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return AIAgentOut.model_validate(agent)


@router.put(
    "/agents/{agent_id}",
    response_model=AIAgentOut,
    dependencies=[Depends(require_permissions("ai.manage"))],
)
async def update_agent(
    agent_id: UUID,
    payload: AIAgentUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> AIAgentOut:
    agent = await db.get(AIAgent, agent_id)
    if not agent or agent.tenant_id != tenant_id:
        raise NotFound("Agent not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(agent, k, v)
    await db.commit()
    await db.refresh(agent)
    return AIAgentOut.model_validate(agent)


@router.post(
    "/reply",
    response_model=ReplyResponse,
    dependencies=[Depends(require_permissions("inbox.write"))],
)
async def draft_reply(
    payload: ReplyRequest, db: DbSession, tenant_id: TenantId
) -> ReplyResponse:
    data = await ai_service.draft_reply(
        db, tenant_id, payload.conversation_id, payload.agent_id
    )
    return ReplyResponse(**data)


@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    dependencies=[Depends(require_permissions("inbox.read"))],
)
async def summarize(
    payload: SummarizeRequest, db: DbSession, tenant_id: TenantId
) -> SummarizeResponse:
    data = await ai_service.summarize(db, tenant_id, payload.conversation_id)
    return SummarizeResponse(**data)


@router.post(
    "/route",
    response_model=RouteResponse,
    dependencies=[Depends(require_permissions("inbox.read"))],
)
async def route(
    payload: RouteRequest, db: DbSession, tenant_id: TenantId
) -> RouteResponse:
    data = await ai_service.route(db, tenant_id, payload.text)
    return RouteResponse(**data)
