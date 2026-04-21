from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    ai,
    analytics,
    auth,
    billing,
    channels,
    contacts,
    inbox,
    kb,
    leads,
    messages,
    tenants,
    users,
    workflows,
)

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
router.include_router(channels.router, prefix="/channels", tags=["channels"])
router.include_router(inbox.router, prefix="/conversations", tags=["inbox"])
router.include_router(messages.router, prefix="/messages", tags=["messages"])
router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
router.include_router(leads.router, prefix="/leads", tags=["leads"])
router.include_router(ai.router, prefix="/ai", tags=["ai"])
router.include_router(kb.router, prefix="/kb", tags=["kb"])
router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(billing.router, prefix="/billing", tags=["billing"])
