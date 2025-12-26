"""RBAC (roles & permissions) management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_permissions
from app.core.audit import audit_event
from app.core.exceptions import (
    PermissionNotFoundError,
    RoleAlreadyExistsError,
    RoleInUseError,
    RoleNameNotFoundError,
    RoleNotFoundError,
    SystemRoleImmutableError,
    UserNotFoundError,
)
from app.database import get_db
from app.models.rbac import Permission, Role, user_roles
from app.models.user import User
from app.schemas.rbac import (
    PermissionResponse,
    RoleCreate,
    RolePermissionsUpdate,
    RoleResponse,
    RoleUpdate,
    UserRolesUpdate,
)
from app.schemas.user import UserResponse

router = APIRouter(tags=["rbac"])


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rbac:read"))],
) -> list[RoleResponse]:
    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).order_by(Role.id)
    )
    roles = result.scalars().all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("rbac:write"))],
    request: Request,
) -> RoleResponse:
    existing = (
        await db.execute(select(Role).where(Role.name == payload.name))
    ).scalar_one_or_none()
    if existing:
        raise RoleAlreadyExistsError(payload.name)

    role = Role(
        name=payload.name,
        description=payload.description,
        exclusive_group=payload.exclusive_group,
        priority=payload.priority,
        is_system=False,
    )
    db.add(role)
    await db.flush()
    audit_event(
        db,
        actor_user_id=actor.id,
        action="rbac.role.create",
        target_type="role",
        target_id=role.id,
        payload={
            "name": role.name,
            "description": role.description,
            "exclusive_group": role.exclusive_group,
            "priority": role.priority,
        },
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    payload: RoleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("rbac:write"))],
    request: Request,
) -> RoleResponse:
    role = await db.get(Role, role_id)
    if not role:
        raise RoleNotFoundError(role_id)

    if payload.name and payload.name != role.name:
        existing = (
            await db.execute(
                select(Role).where(Role.name == payload.name).where(Role.id != role_id)
            )
        ).scalar_one_or_none()
        if existing:
            raise RoleAlreadyExistsError(payload.name)
        role.name = payload.name

    if payload.description is not None:
        role.description = payload.description

    if payload.exclusive_group is not None and not role.is_system:
        # For non-system roles, allow setting/clearing exclusive_group.
        role.exclusive_group = payload.exclusive_group

    if payload.priority is not None and not role.is_system:
        role.priority = payload.priority

    audit_event(
        db,
        actor_user_id=actor.id,
        action="rbac.role.update",
        target_type="role",
        target_id=role.id,
        payload={
            "name": role.name,
            "description": role.description,
            "exclusive_group": role.exclusive_group,
            "priority": role.priority,
        },
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("rbac:write"))],
    request: Request,
) -> None:
    role = await db.get(Role, role_id)
    if not role:
        raise RoleNotFoundError(role_id)
    if role.is_system:
        raise SystemRoleImmutableError(role.name)

    in_use = (
        await db.execute(
            select(user_roles.c.user_id).where(user_roles.c.role_id == role_id).limit(1)
        )
    ).scalar_one_or_none()
    if in_use is not None:
        raise RoleInUseError(role_id)
    audit_event(
        db,
        actor_user_id=actor.id,
        action="rbac.role.delete",
        target_type="role",
        target_id=role_id,
        payload={"name": role.name},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.delete(role)
    await db.commit()


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rbac:read"))],
) -> list[PermissionResponse]:
    result = await db.execute(select(Permission).order_by(Permission.id))
    permissions = result.scalars().all()
    return [PermissionResponse.model_validate(p) for p in permissions]


@router.put("/roles/{role_id}/permissions", response_model=RoleResponse)
async def set_role_permissions(
    role_id: int,
    payload: RolePermissionsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("rbac:write"))],
    request: Request,
) -> RoleResponse:
    role = (
        await db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        )
    ).scalar_one_or_none()
    if not role:
        raise RoleNotFoundError(role_id)

    before_codes = sorted({p.code for p in role.permissions})
    codes = [c.strip() for c in payload.permission_codes if c.strip()]
    if not codes:
        role.permissions = []
        audit_event(
            db,
            actor_user_id=actor.id,
            action="rbac.role.permissions.set",
            target_type="role",
            target_id=role.id,
            payload={"before": before_codes, "after": []},
            request_id=request.headers.get("x-request-id"),
            ip=(request.client.host if request.client else None),
            user_agent=request.headers.get("user-agent"),
        )
        await db.commit()
        await db.refresh(role)
        return RoleResponse.model_validate(role)

    result = await db.execute(select(Permission).where(Permission.code.in_(codes)))
    permissions = result.scalars().all()
    found_codes = {p.code for p in permissions}
    missing = [c for c in codes if c not in found_codes]
    if missing:
        raise PermissionNotFoundError(missing)

    role.permissions = list(permissions)
    audit_event(
        db,
        actor_user_id=actor.id,
        action="rbac.role.permissions.set",
        target_type="role",
        target_id=role.id,
        payload={"before": before_codes, "after": sorted(codes)},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)


@router.put("/users/{user_id}/roles", response_model=UserResponse)
async def set_user_roles(
    user_id: int,
    payload: UserRolesUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("rbac:write"))],
    request: Request,
) -> UserResponse:
    user = (
        await db.execute(select(User).options(selectinload(User.roles)).where(User.id == user_id))
    ).scalar_one_or_none()
    if not user:
        raise UserNotFoundError(user_id)

    before_names = sorted({r.name for r in user.roles})
    names = [n.strip() for n in payload.role_names if n.strip()]
    if not names:
        user.roles = []
        audit_event(
            db,
            actor_user_id=actor.id,
            action="rbac.user.roles.set",
            target_type="user",
            target_id=user.id,
            payload={"before": before_names, "requested": [], "after": []},
            request_id=request.headers.get("x-request-id"),
            ip=(request.client.host if request.client else None),
            user_agent=request.headers.get("user-agent"),
        )
        await db.commit()
        await db.refresh(user)
        return UserResponse.model_validate(user)

    result = await db.execute(select(Role).where(Role.name.in_(names)))
    roles = result.scalars().all()
    found_names = {r.name for r in roles}
    missing = [n for n in names if n not in found_names]
    if missing:
        raise RoleNameNotFoundError(missing)

    # Normalize mutually exclusive role groups: within the same exclusive_group,
    # keep only the role with the highest priority.
    normalized: dict[str | None, Role] = {}
    for role in roles:
        group = role.exclusive_group
        if group is None:
            # group-less roles are additive; keep all by storing with unique keys
            normalized[f"__nogroup__:{role.name}"] = role
            continue
        existing = normalized.get(group)
        if existing is None or role.priority > existing.priority:
            normalized[group] = role

    user.roles = list(normalized.values())
    after_names = sorted({r.name for r in user.roles})
    audit_event(
        db,
        actor_user_id=actor.id,
        action="rbac.user.roles.set",
        target_type="user",
        target_id=user.id,
        payload={"before": before_names, "requested": names, "after": after_names},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
