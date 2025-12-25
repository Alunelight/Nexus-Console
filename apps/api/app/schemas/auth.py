"""Authentication schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = None

    model_config = ConfigDict(strict=True)


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str

    model_config = ConfigDict(strict=True)


class TokenResponse(BaseModel):
    """Schema for token response (not used with cookie-based auth, but kept for compatibility)."""

    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(strict=True)
