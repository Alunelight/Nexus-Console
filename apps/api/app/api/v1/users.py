"""User API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_permissions
from app.core.audit import audit_event
from app.core.exceptions import EmailAlreadyExistsError, UserNotFoundError
from app.database import get_db
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# 注意：/me 路由必须在 /{user_id} 之前定义，否则 FastAPI 会将 "me" 匹配为 user_id
@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Update current authenticated user's profile."""
    # 如果更新邮箱，检查是否已被使用
    if user_update.email and user_update.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_update.email))
        if result.scalar_one_or_none():
            raise EmailAlreadyExistsError(user_update.email)

    # 更新字段
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    refreshed = (
        await db.execute(
            select(User).options(selectinload(User.roles)).where(User.id == current_user.id)
        )
    ).scalar_one()
    return UserResponse.model_validate(refreshed)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("users:write"))],
    request: Request,
) -> UserResponse:
    """Create a new user."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise EmailAlreadyExistsError(user.email)

    # Create new user
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.flush()
    audit_event(
        db,
        actor_user_id=actor.id,
        action="users.create",
        target_type="user",
        target_id=db_user.id,
        payload={"email": db_user.email, "name": db_user.name, "is_active": db_user.is_active},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(db_user)
    return UserResponse.model_validate(db_user)


@router.get("/page", response_model=PaginatedResponse[UserResponse])
async def list_users_page(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("users:read"))],
    skip: int = 0,
    limit: int = 20,
    q: str | None = None,
    is_active: bool | None = None,
) -> PaginatedResponse[UserResponse]:
    """List users with server-side pagination, optional search, and status filter."""
    filters = []

    if is_active is not None:
        filters.append(User.is_active.is_(is_active))

    query = (q or "").strip()
    if query:
        like = f"%{query}%"
        filters.append(or_(User.email.ilike(like), User.name.ilike(like)))

    total_stmt = select(func.count()).select_from(User)
    if filters:
        total_stmt = total_stmt.where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    items_stmt = (
        select(User).options(selectinload(User.roles)).order_by(User.id).offset(skip).limit(limit)
    )
    if filters:
        items_stmt = items_stmt.where(*filters)

    result = await db.execute(items_stmt)
    users = result.scalars().all()
    items = [UserResponse.model_validate(u) for u in users]
    return PaginatedResponse[UserResponse].create(items=items, total=total, skip=skip, limit=limit)


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("users:read"))],
    skip: int = 0,
    limit: int = 100,
) -> list[UserResponse]:
    """List all users."""
    result = await db.execute(
        select(User).options(selectinload(User.roles)).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return [UserResponse.model_validate(user) for user in users]


# 注意：/{user_id} 路由必须在 /page 和 / 之后定义，否则 FastAPI 会将 "page" 或空字符串匹配为 user_id
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("users:read"))],
) -> UserResponse:
    """Get a user by ID."""
    user = (
        await db.execute(select(User).options(selectinload(User.roles)).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(user_id)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("users:write"))],
    request: Request,
) -> UserResponse:
    """Update a user."""
    user = (
        await db.execute(select(User).options(selectinload(User.roles)).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(user_id)

    before = {"email": user.email, "name": user.name, "is_active": user.is_active}

    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    after = {"email": user.email, "name": user.name, "is_active": user.is_active}
    audit_event(
        db,
        actor_user_id=actor.id,
        action="users.update",
        target_type="user",
        target_id=user.id,
        payload={"before": before, "after": after},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    refreshed = (
        await db.execute(select(User).options(selectinload(User.roles)).where(User.id == user_id))
    ).scalar_one()
    return UserResponse.model_validate(refreshed)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("users:write"))],
    request: Request,
) -> None:
    """Delete a user."""
    user = await db.get(User, user_id)
    if not user:
        raise UserNotFoundError(user_id)

    audit_event(
        db,
        actor_user_id=actor.id,
        action="users.delete",
        target_type="user",
        target_id=user.id,
        payload={"email": user.email, "name": user.name, "is_active": user.is_active},
        request_id=request.headers.get("x-request-id"),
        ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    await db.delete(user)
    await db.commit()
