from __future__ import annotations

from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_token
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws")
async def ws_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
) -> None:
    try:
        payload = decode_token(token)
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

    await manager.connect(tenant_id, websocket)
    try:
        while True:
            # Client → server messages (e.g., typing indicators) can be handled here.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(tenant_id, websocket)
