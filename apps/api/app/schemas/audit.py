"""Audit log schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: int | None = None
    action: str
    target_type: str
    target_id: int | None = None
    payload: dict | None = None
    request_id: str | None = None
    ip: str | None = None
    user_agent: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
