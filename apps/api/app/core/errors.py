"""Error handling middleware and custom exceptions."""

from fastapi import Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import BaseBusinessException
from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str
    detail: str | None = None
    status_code: int
    code: str | None = None  # Error code for programmatic handling


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

    # Format validation errors for better user experience
    details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Invalid value")
        details.append(f"{field}: {message}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": "; ".join(details) if details else "Invalid input",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "code": "VALIDATION_ERROR",
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

    # Try to extract user-friendly error message
    error_str = str(exc.orig).lower()
    if "unique constraint" in error_str or "duplicate key" in error_str:
        detail = "A record with this value already exists"
    elif "foreign key" in error_str:
        detail = "Referenced record does not exist"
    else:
        detail = "A database constraint was violated"

    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": "Integrity Error",
            "detail": detail,
            "status_code": status.HTTP_409_CONFLICT,
            "code": "INTEGRITY_ERROR",
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTPException (including BaseBusinessException)."""
    # Check if it's a BaseBusinessException with error code
    error_code = None
    if isinstance(exc, BaseBusinessException):
        error_code = exc.error_code
        logger.warning(
            "business_exception",
            path=request.url.path,
            method=request.method,
            error_code=error_code,
            detail=exc.detail,
        )
    else:
        logger.warning(
            "http_exception",
            path=request.url.path,
            method=request.method,
            status_code=exc.status_code,
            detail=exc.detail,
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail or "An error occurred",
            "detail": exc.detail,
            "status_code": exc.status_code,
            "code": error_code,
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
            "code": "INTERNAL_SERVER_ERROR",
        },
    )
