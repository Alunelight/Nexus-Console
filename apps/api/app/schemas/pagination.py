"""Pagination schemas."""

from pydantic import BaseModel, ConfigDict, Field


class PaginationParams(BaseModel):
    """Pagination query parameters."""

    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=100, ge=1, le=1000, description="Number of items to return")

    model_config = ConfigDict(frozen=True)


class PaginatedResponse[T](BaseModel):
    """Paginated response model."""

    items: list[T] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    skip: int = Field(description="Number of items skipped")
    limit: int = Field(description="Number of items per page")
    has_more: bool = Field(description="Whether there are more items")

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        skip: int,
        limit: int,
    ) -> "PaginatedResponse[T]":
        """Create a paginated response."""
        return cls(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(items)) < total,
        )
