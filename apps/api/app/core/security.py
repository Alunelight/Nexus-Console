"""Security utilities for authentication and authorization."""

from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: int, token_version: int) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: The user's ID
        token_version: The current token version (for revocation)

    Returns:
        Encoded JWT token
    """
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expires_minutes)
    to_encode = {
        "sub": str(user_id),
        "ver": token_version,
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "access",
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def create_refresh_token(user_id: int, token_version: int) -> str:
    """
    Create a JWT refresh token.

    Args:
        user_id: The user's ID
        token_version: The current token version (for revocation)

    Returns:
        Encoded JWT token
    """
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expires_days)
    to_encode = {
        "sub": str(user_id),
        "ver": token_version,
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "refresh",
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> dict[str, object]:
    """
    Decode and verify a JWT token.

    Args:
        token: The encoded JWT token

    Returns:
        The decoded token payload

    Raises:
        JWTError: If token is invalid or expired
    """
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
