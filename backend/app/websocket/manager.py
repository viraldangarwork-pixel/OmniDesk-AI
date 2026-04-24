from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket

from app.core.logging import logger


class ConnectionManager:
    """In-process pub/sub for WebSocket clients scoped by tenant."""

    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(
        self,
        tenant_id: UUID,
        websocket: WebSocket,
        subprotocol: str | None = None,
    ) -> None:
        # Completing the handshake with the negotiated sub-protocol echoes
        # only the protocol name back to the client — never the token.
        await websocket.accept(subprotocol=subprotocol)
        async with self._lock:
            self._connections[tenant_id].add(websocket)
        logger.info("ws.connect", tenant_id=str(tenant_id))

    async def disconnect(self, tenant_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[tenant_id].discard(websocket)
            if not self._connections[tenant_id]:
                self._connections.pop(tenant_id, None)
        logger.info("ws.disconnect", tenant_id=str(tenant_id))

    async def broadcast(
        self, tenant_id: UUID, event: str, data: dict[str, Any]
    ) -> None:
        payload = json.dumps({"event": event, "data": data}, default=str)
        dead: list[WebSocket] = []
        async with self._lock:
            targets = list(self._connections.get(tenant_id, set()))
        for ws in targets:
            try:
                await ws.send_text(payload)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            await self.disconnect(tenant_id, ws)


manager = ConnectionManager()
