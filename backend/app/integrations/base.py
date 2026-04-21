from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ChannelAdapter(ABC):
    """Base class for outbound message senders on a given channel."""

    name: str = "base"

    @abstractmethod
    async def send_text(self, to: str, text: str, **kwargs: Any) -> dict[str, Any]:
        raise NotImplementedError

    async def verify_webhook(self, payload: dict[str, Any]) -> bool:
        return True
