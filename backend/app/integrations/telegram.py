from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.integrations.base import ChannelAdapter


class TelegramAdapter(ChannelAdapter):
    name = "telegram"

    def __init__(self, token: str | None = None) -> None:
        self.token = token or settings.TELEGRAM_BOT_TOKEN

    async def send_text(self, to: str, text: str, **kwargs: Any) -> dict[str, Any]:
        if not self.token:
            return {"status": "stub", "to": to, "text": text}
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json={"chat_id": to, "text": text})
            resp.raise_for_status()
            return resp.json()
