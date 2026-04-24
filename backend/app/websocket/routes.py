from __future__ import annotations

from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_token
from app.websocket.manager import manager

router = APIRouter()


def _extract_token(websocket: WebSocket, query_token: str | None) -> str | None:
    """Pull the JWT out of the sub-protocol header first, falling back to the
    legacy ``?token=`` query param for back-compat during the rollout.

    The browser sends::

        Sec-WebSocket-Protocol: bearer, <jwt>

    which arrives as ``websocket.scope["subprotocols"] = ["bearer", "<jwt>"]``.
    """
    subprotocols = websocket.scope.get("subprotocols") or []
    if len(subprotocols) >= 2 and subprotocols[0].lower() == "bearer":
        return subprotocols[1]
    return query_token


@router.websocket("/ws")
async def ws_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None, description="Legacy JWT fallback; prefer sub-protocol auth"),
) -> None:
    raw_token = _extract_token(websocket, token)
    if not raw_token:
        # Reject the handshake cleanly — the client will surface an auth error.
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_token(raw_token)
    except jwt.PyJWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if payload.get("type") != "access":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    tenant_raw = payload.get("tenant_id")
    if not tenant_raw:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    tenant_id = UUID(tenant_raw)

    # Echo back only the protocol name — never the token itself.
    subprotocol = "bearer" if "bearer" in (websocket.scope.get("subprotocols") or []) else None
    await manager.connect(tenant_id, websocket, subprotocol=subprotocol)

    try:
        while True:
            # Client → server frames (typing indicators, read receipts, etc.)
            # can be dispatched here in future.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(tenant_id, websocket)
