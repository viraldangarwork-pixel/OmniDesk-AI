from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.schemas.common import ORMModel, TimestampedOut


class WorkflowBase(ORMModel):
    name: str
    description: Optional[str] = None
    trigger: dict = {}
    steps: list = []


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(ORMModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[dict] = None
    steps: Optional[list] = None
    active: Optional[bool] = None


class WorkflowOut(WorkflowBase, TimestampedOut):
    active: bool = True


class WorkflowRunRequest(ORMModel):
    workflow_id: UUID
    context: dict = {}


class WorkflowRunOut(TimestampedOut):
    workflow_id: UUID
    status: str
    context: dict = {}
    result: dict = {}
    error: Optional[str] = None
