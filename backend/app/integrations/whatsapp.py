from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.integrations.base import ChannelAdapter


class WhatsAppAdapter(ChannelAdapter):
    name = "whatsapp"

    def __init__(self, phone_id: str | None = None, token: str | None = None) -> None:
        self.phone_id = phone_id or settings.WHATSAPP_PHONE_ID
        self.token = token or settings.WHATSAPP_TOKEN

    async def send_text(self, to: str, text: str, **kwargs: Any) -> dict[str, Any]:
        if not self.phone_id or not self.token:
            return {"status": "stub", "to": to, "text": text}
        url = f"https://graph.facebook.com/v18.0/{self.phone_id}/messages"
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text},
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=data)
            resp.raise_for_status()
            return resp.json()
