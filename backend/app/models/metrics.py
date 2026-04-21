from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DailyMetric(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    tenant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    conversations_opened: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conversations_closed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    messages_in: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    messages_out: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_handled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    leads_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    leads_won: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_first_response_seconds: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "day", name="uq_daily_metric_tenant_day"),
    )


class AgentMetric(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    tenant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    conversations_handled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_response_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    csat_score: Mapped[Optional[float]] = mapped_column(
        Numeric(4, 2), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "user_id", "day", name="uq_agent_metric_tenant_user_day"
        ),
    )
