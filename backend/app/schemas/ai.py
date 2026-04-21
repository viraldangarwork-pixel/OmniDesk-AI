from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.schemas.common import ORMModel, TimestampedOut


class AIAgentBase(ORMModel):
    name: str
    role: str = "assistant"
    model: str = "claude-opus-4-7"
    system_prompt: str = ""
    temperature: int = 70
    max_tokens: int = 1024
    tools: list = []
    routing_rules: list = []


class AIAgentCreate(AIAgentBase):
    pass


class AIAgentUpdate(ORMModel):
    name: Optional[str] = None
    role: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[int] = None
    max_tokens: Optional[int] = None
    tools: Optional[list] = None
    routing_rules: Optional[list] = None
    active: Optional[bool] = None


class AIAgentOut(AIAgentBase, TimestampedOut):
    active: bool = True


class ReplyRequest(ORMModel):
    conversation_id: UUID
    agent_id: Optional[UUID] = None


class ReplyResponse(ORMModel):
    reply: str
    tokens_in: int = 0
    tokens_out: int = 0
    latency_ms: int = 0


class SummarizeRequest(ORMModel):
    conversation_id: UUID


class SummarizeResponse(ORMModel):
    summary: str


class RouteRequest(ORMModel):
    text: str


class RouteResponse(ORMModel):
    queue: str
