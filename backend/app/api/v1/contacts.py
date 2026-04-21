from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select

from app.api.deps import DbSession, TenantId, require_permissions
from app.core.exceptions import NotFound
from app.models.contact import Contact
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(dependencies=[Depends(require_permissions("contacts.manage"))])


@router.get("", response_model=PaginatedResponse[ContactOut])
async def list_contacts(
    db: DbSession,
    tenant_id: TenantId,
    pagination: Annotated[PaginationParams, Depends()],
    q: str | None = Query(default=None),
) -> PaginatedResponse[ContactOut]:
    base = select(Contact).where(Contact.tenant_id == tenant_id)
    count_stmt = (
        select(func.count()).select_from(Contact).where(Contact.tenant_id == tenant_id)
    )
    if q:
        like = f"%{q}%"
        base = base.where(
            Contact.full_name.ilike(like)
            | Contact.email.ilike(like)
            | Contact.phone.ilike(like)
        )
        count_stmt = count_stmt.where(
            Contact.full_name.ilike(like)
            | Contact.email.ilike(like)
            | Contact.phone.ilike(like)
        )
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        base.order_by(Contact.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse[ContactOut](
        items=[ContactOut.model_validate(c) for c in items],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate, db: DbSession, tenant_id: TenantId
) -> ContactOut:
    contact = Contact(tenant_id=tenant_id, **payload.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return ContactOut.model_validate(contact)


@router.put("/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> ContactOut:
    contact = await db.get(Contact, contact_id)
    if not contact or contact.tenant_id != tenant_id:
        raise NotFound("Contact not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(contact, k, v)
    await db.commit()
    await db.refresh(contact)
    return ContactOut.model_validate(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID, db: DbSession, tenant_id: TenantId
) -> None:
    contact = await db.get(Contact, contact_id)
    if not contact or contact.tenant_id != tenant_id:
        raise NotFound("Contact not found")
    await db.delete(contact)
    await db.commit()
