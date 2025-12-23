"""Redis cache configuration."""

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


async def init_cache() -> None:
    """Initialize Redis cache."""
    try:
        redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
        logger.info("cache_initialized", redis_url=settings.redis_url)
    except Exception as e:
        logger.error("cache_initialization_failed", error=str(e))
        raise


async def close_cache() -> None:
    """Close Redis cache connection."""
    try:
        await FastAPICache.clear()
        logger.info("cache_closed")
    except Exception as e:
        logger.warning("cache_close_failed", error=str(e))
