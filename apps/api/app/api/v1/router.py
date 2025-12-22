"""API v1 router."""

from fastapi import APIRouter

from app.api.v1 import users

api_router = APIRouter(prefix="/v1")

api_router.include_router(users.router)
