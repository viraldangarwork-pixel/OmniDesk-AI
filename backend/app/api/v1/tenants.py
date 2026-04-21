from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.tenant import Tenant
from app.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter()


@router.get("/me", response_model=TenantOut)
async def get_my_tenant(db: DbSession, tenant_id: TenantId) -> TenantOut:
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise NotFound("Tenant not found")
    return TenantOut.model_validate(tenant)


@router.put(
    "/me",
    response_model=TenantOut,
    dependencies=[Depends(require_permissions("tenants.manage"))],
)
async def update_my_tenant(
    payload: TenantUpdate, db: DbSession, tenant_id: TenantId
) -> TenantOut:
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise NotFound("Tenant not found")
    if payload.name is not None:
        tenant.name = payload.name
    if payload.domain is not None:
        tenant.domain = payload.domain
    if payload.settings is not None:
        tenant.settings = {**(tenant.settings or {}), **payload.settings}
    await db.commit()
    await db.refresh(tenant)
    return TenantOut.model_validate(tenant)
