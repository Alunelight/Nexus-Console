"""Audit logging helpers (DB + structlog)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.audit_log import AuditLog

logger = get_logger(__name__)


def audit_event(
    db: AsyncSession,
    *,
    actor_user_id: int | None,
    action: str,
    target_type: str,
    target_id: int | None,
    payload: dict | None = None,
    request_id: str | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """
    Add an audit log record to the current DB session and write a structured log.

    Notes:
    - This function does NOT commit. Callers should commit/rollback as part of their transaction.
    """
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload=payload,
            request_id=request_id,
            ip=ip,
            user_agent=user_agent,
        )
    )

    logger.info(
        "audit",
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        payload=payload,
        request_id=request_id,
        ip=ip,
        user_agent=user_agent,
    )
