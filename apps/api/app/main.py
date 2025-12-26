"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.exc import IntegrityError

from app.api.v1.router import api_router
from app.config import settings
from app.core.cache import close_cache, init_cache
from app.core.errors import (
    generic_exception_handler,
    http_exception_handler,
    integrity_error_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging, get_logger

# Configure structured logging
configure_logging()
logger = get_logger(__name__)

# Configure rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan events."""
    # Startup
    logger.info("application_startup", version=settings.app_version, debug=settings.debug)

    # 验证生产环境配置
    if not settings.debug:
        logger.info("production_mode_enabled", secret_key_length=len(settings.secret_key))

    # 初始化缓存
    await init_cache()

    yield

    # Shutdown
    await close_cache()
    logger.info("application_shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# Add error handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(IntegrityError, integrity_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, generic_exception_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # 明确指定允许的方法
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],  # 明确指定允许的头
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request) -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Welcome to Nexus Console API", "version": settings.app_version}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
