"""Error handling middleware and custom exceptions."""

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str
    detail: str | None = None
    status_code: int


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors."""
    logger.warning(
        "validation_error",
        path=request.url.path,
        method=request.method,
        errors=exc.errors(),
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": exc.errors(),
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
        },
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handle database integrity errors."""
    logger.error(
        "integrity_error",
        path=request.url.path,
        method=request.method,
        error=str(exc.orig),
    )

    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": "Integrity Error",
            "detail": "A database constraint was violated",
            "status_code": status.HTTP_409_CONFLICT,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions."""
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )
