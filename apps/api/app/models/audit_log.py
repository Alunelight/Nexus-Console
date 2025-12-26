"""Audit log model."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    """Audit log record for security-relevant changes."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_target", "target_type", "target_id"),
        {"comment": "Audit logs (DB + structlog)"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    actor_user_id: Mapped[int | None] = mapped_column(
        Integer(),
        ForeignKey("users.id", ondelete="SET NULL"),
        default=None,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(128), index=True)
    target_type: Mapped[str] = mapped_column(String(64), index=True)
    target_id: Mapped[int | None] = mapped_column(Integer(), default=None, index=True)
    payload: Mapped[dict | None] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=None,
    )

    request_id: Mapped[str | None] = mapped_column(String(128), default=None, index=True)
    ip: Mapped[str | None] = mapped_column(String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column(String(256), default=None)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
