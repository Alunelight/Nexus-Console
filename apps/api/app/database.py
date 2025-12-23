"""Database configuration and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Create async engine with connection pool configuration
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    pool_size=20,  # 连接池大小
    max_overflow=10,  # 最大溢出连接
    pool_pre_ping=True,  # 连接健康检查
    pool_recycle=3600,  # 连接回收时间（秒）
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Dependency for getting async database sessions."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
