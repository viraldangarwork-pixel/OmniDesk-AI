from __future__ import annotations

from app.core.logging import logger
from app.workers.celery_app import celery_app


@celery_app.task(name="kb.ingest_document")
def ingest_document(document_id: str) -> dict:
    logger.info("kb.ingest.start", document_id=document_id)
    # TODO: fetch document, chunk, embed, persist KBChunk rows with pgvector.
    return {"document_id": document_id, "status": "stubbed"}


@celery_app.task(name="workflow.run")
def run_workflow(run_id: str) -> dict:
    logger.info("workflow.run.start", run_id=run_id)
    # TODO: load WorkflowRun, evaluate trigger + conditions, execute actions.
    return {"run_id": run_id, "status": "stubbed"}


@celery_app.task(name="inbox.inbound_message")
def inbound_message(channel_id: str, payload: dict) -> dict:
    logger.info("inbox.inbound", channel_id=channel_id)
    # TODO: normalize webhook payload, upsert contact, persist Message, broadcast WS.
    return {"channel_id": channel_id, "status": "stubbed"}
