"""Authentication identity model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuthIdentity(Base):
    """Authentication identity model for storing user credentials."""

    __tablename__ = "auth_identities"

    # 复合唯一索引：同一个 provider + identifier 组合必须唯一
    __table_args__ = (
        Index("ix_auth_identities_provider_identifier", "provider", "identifier", unique=True),
        {"comment": "Authentication identities table for user credentials"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(
        default="password", index=True
    )  # password, google, github, etc.
    identifier: Mapped[str] = mapped_column(index=True)  # email for password, external id for OAuth
    hashed_password: Mapped[str | None] = mapped_column(default=None)  # Only for password provider
    token_version: Mapped[int] = mapped_column(default=0)  # For token revocation
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationship
    user: Mapped[User] = relationship("User", back_populates="auth_identities")
