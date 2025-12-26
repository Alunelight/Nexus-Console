"""Audit log query endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.pagination import PaginatedResponse

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rbac:read"))],
    skip: int = 0,
    limit: int = 50,
    actor_user_id: int | None = None,
    action: str | None = None,
    target_type: str | None = None,
    target_id: int | None = None,
    request_id: str | None = None,
) -> PaginatedResponse[AuditLogResponse]:
    """List audit logs with pagination and optional filters."""
    filters = []
    if actor_user_id is not None:
        filters.append(AuditLog.actor_user_id == actor_user_id)
    if action:
        filters.append(AuditLog.action == action.strip())
    if target_type:
        filters.append(AuditLog.target_type == target_type.strip())
    if target_id is not None:
        filters.append(AuditLog.target_id == target_id)
    if request_id:
        filters.append(AuditLog.request_id == request_id.strip())

    total_stmt = select(func.count()).select_from(AuditLog)
    if filters:
        total_stmt = total_stmt.where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    items_stmt = (
        select(AuditLog)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset(skip)
        .limit(limit)
    )
    if filters:
        items_stmt = items_stmt.where(*filters)

    result = await db.execute(items_stmt)
    logs = result.scalars().all()
    items = [AuditLogResponse.model_validate(log) for log in logs]
    return PaginatedResponse[AuditLogResponse].create(
        items=items, total=total, skip=skip, limit=limit
    )


@router.get("/logs/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rbac:read"))],
) -> AuditLogResponse:
    log = await db.get(AuditLog, log_id)
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    return AuditLogResponse.model_validate(log)
