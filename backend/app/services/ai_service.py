from __future__ import annotations

import time
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.ai_agent import AIAgent, AILog
from app.models.conversation import Message

try:
    from anthropic import AsyncAnthropic
except Exception:  # pragma: no cover — optional at dev time
    AsyncAnthropic = None  # type: ignore


def _client() -> Any:
    if not AsyncAnthropic or not settings.ANTHROPIC_API_KEY:
        return None
    return AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


DEFAULT_SYSTEM = (
    "You are a helpful customer support AI for the OmniDesk platform. "
    "Be concise, friendly, and accurate. If unsure, ask a clarifying question."
)


async def _log(
    db: AsyncSession,
    tenant_id: UUID,
    action: str,
    agent_id: UUID | None,
    conversation_id: UUID | None,
    input_tokens: int,
    output_tokens: int,
    latency_ms: int,
    payload: dict | None = None,
) -> None:
    entry = AILog(
        tenant_id=tenant_id,
        agent_id=agent_id,
        conversation_id=conversation_id,
        action=action,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        payload=payload or {},
    )
    db.add(entry)
    await db.commit()


async def _run(
    agent: AIAgent | None,
    messages: list[dict[str, str]],
    system_override: str | None = None,
    max_tokens: int = 600,
) -> tuple[str, int, int, int]:
    client = _client()
    started = time.time()
    system = system_override or (agent.system_prompt if agent else DEFAULT_SYSTEM)
    model = agent.model if agent else settings.ANTHROPIC_MODEL

    if client is None:
        logger.warning("ai.stub", reason="no_anthropic_key")
        return (
            "[AI stub] " + (messages[-1]["content"] if messages else "No input."),
            0,
            0,
            int((time.time() - started) * 1000),
        )

    response = await client.messages.create(
        model=model,
        system=system,
        max_tokens=max_tokens,
        messages=messages,
    )
    text = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    )
    usage_in = getattr(response.usage, "input_tokens", 0)
    usage_out = getattr(response.usage, "output_tokens", 0)
    return text, usage_in, usage_out, int((time.time() - started) * 1000)


async def draft_reply(
    db: AsyncSession,
    tenant_id: UUID,
    conversation_id: UUID,
    agent_id: UUID | None = None,
) -> dict[str, Any]:
    agent = None
    if agent_id:
        agent = await db.get(AIAgent, agent_id)
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .limit(40)
    )
    history = [
        {
            "role": "assistant" if m.direction.value == "outbound" else "user",
            "content": m.content or "",
        }
        for m in msgs_result.scalars().all()
        if m.content
    ]
    if not history:
        history = [{"role": "user", "content": "Hello"}]

    text, tok_in, tok_out, latency = await _run(agent, history)
    await _log(
        db,
        tenant_id,
        "reply",
        agent.id if agent else None,
        conversation_id,
        tok_in,
        tok_out,
        latency,
    )
    return {"reply": text, "tokens_in": tok_in, "tokens_out": tok_out, "latency_ms": latency}


async def summarize(
    db: AsyncSession,
    tenant_id: UUID,
    conversation_id: UUID,
) -> dict[str, Any]:
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    transcript = "\n".join(
        f"{m.sender_type.value}: {m.content}"
        for m in msgs_result.scalars().all()
        if m.content
    )
    prompt = [
        {
            "role": "user",
            "content": (
                "Summarize this support conversation in 4-6 bullet points. "
                "Include the customer's intent, key facts, and open questions.\n\n"
                f"{transcript[:8000]}"
            ),
        }
    ]
    text, tok_in, tok_out, latency = await _run(None, prompt, max_tokens=400)
    await _log(
        db, tenant_id, "summarize", None, conversation_id, tok_in, tok_out, latency
    )
    return {"summary": text}


async def route(
    db: AsyncSession,
    tenant_id: UUID,
    text: str,
) -> dict[str, Any]:
    prompt = [
        {
            "role": "user",
            "content": (
                "Classify this customer message into one of: "
                "sales, support, billing, technical, other. "
                "Respond with just the single label.\n\n"
                f"Message: {text[:2000]}"
            ),
        }
    ]
    label, tok_in, tok_out, latency = await _run(None, prompt, max_tokens=20)
    label = label.strip().lower().split()[0] if label else "other"
    await _log(db, tenant_id, "route", None, None, tok_in, tok_out, latency, {"label": label})
    return {"queue": label}
