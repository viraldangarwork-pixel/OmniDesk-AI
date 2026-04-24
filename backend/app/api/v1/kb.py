from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import func, select

from app.api.deps import DbSession, TenantId, require_permissions
from app.models.kb import KBChunk, KBDocument
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.kb import KBDocOut, KBSearchResponse, KBUrlIngest, KBChunkOut

router = APIRouter(dependencies=[Depends(require_permissions("kb.manage"))])


@router.get("", response_model=PaginatedResponse[KBDocOut])
async def list_docs(
    db: DbSession,
    tenant_id: TenantId,
    pagination: Annotated[PaginationParams, Depends()],
    q: str | None = Query(default=None),
) -> PaginatedResponse[KBDocOut]:
    base = select(KBDocument).where(KBDocument.tenant_id == tenant_id)
    count_stmt = (
        select(func.count())
        .select_from(KBDocument)
        .where(KBDocument.tenant_id == tenant_id)
    )
    if q:
        like = f"%{q}%"
        base = base.where(KBDocument.title.ilike(like))
        count_stmt = count_stmt.where(KBDocument.title.ilike(like))
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        base.order_by(KBDocument.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse[KBDocOut](
        items=[KBDocOut.model_validate(d) for d in items],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post(
    "/upload",
    response_model=KBDocOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_doc(
    db: DbSession,
    tenant_id: TenantId,
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
) -> KBDocOut:
    doc = KBDocument(
        tenant_id=tenant_id,
        title=title or file.filename or "Untitled",
        source_type="file",
        status="pending",
        meta={"filename": file.filename, "content_type": file.content_type},
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    # NOTE: actual chunking + embedding runs in Celery worker (see workers/kb.py).
    return KBDocOut.model_validate(doc)


@router.post(
    "/url",
    response_model=KBDocOut,
    status_code=status.HTTP_201_CREATED,
)
async def ingest_url(
    payload: KBUrlIngest, db: DbSession, tenant_id: TenantId
) -> KBDocOut:
    doc = KBDocument(
        tenant_id=tenant_id,
        title=payload.title or payload.url,
        source_type="url",
        source_url=payload.url,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return KBDocOut.model_validate(doc)


@router.get("/search", response_model=KBSearchResponse)
async def search(
    db: DbSession,
    tenant_id: TenantId,
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
) -> KBSearchResponse:
    # Placeholder text search; vector search wired up once embeddings exist.
    stmt = (
        select(KBChunk)
        .where(KBChunk.tenant_id == tenant_id, KBChunk.content.ilike(f"%{q}%"))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return KBSearchResponse(
        query=q,
        results=[
            KBChunkOut(id=str(c.id), content=c.content, score=1.0)
            for c in result.scalars().all()
        ],
    )
