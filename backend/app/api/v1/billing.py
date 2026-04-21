from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.tenant import Invoice, Plan, Subscription

router = APIRouter(dependencies=[Depends(require_permissions("billing.manage"))])


@router.get("/plans")
async def list_plans(db: DbSession):
    result = await db.execute(select(Plan).where(Plan.active.is_(True)))
    return [
        {
            "id": str(p.id),
            "code": p.code,
            "name": p.name,
            "price_cents": p.price_cents,
            "currency": p.currency,
            "interval": p.interval,
            "features": p.features,
        }
        for p in result.scalars().all()
    ]


@router.get("/subscription")
async def my_subscription(db: DbSession, tenant_id: TenantId):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .options(selectinload(Subscription.plan))
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFound("Subscription not found")
    return {
        "id": str(sub.id),
        "status": sub.status,
        "plan": {
            "code": sub.plan.code,
            "name": sub.plan.name,
            "price_cents": sub.plan.price_cents,
        },
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "ends_at": sub.ends_at.isoformat() if sub.ends_at else None,
    }


@router.get("/invoices")
async def list_invoices(db: DbSession, tenant_id: TenantId):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.tenant_id == tenant_id)
        .order_by(Invoice.issued_at.desc())
    )
    return [
        {
            "id": str(i.id),
            "number": i.number,
            "amount_cents": i.amount_cents,
            "currency": i.currency,
            "status": i.status,
            "issued_at": i.issued_at.isoformat(),
            "paid_at": i.paid_at.isoformat() if i.paid_at else None,
        }
        for i in result.scalars().all()
    ]
