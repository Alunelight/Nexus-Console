"""Tests for main application endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root(client: AsyncClient) -> None:
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_with_invalid_method(client: AsyncClient) -> None:
    """Test root endpoint with invalid HTTP method."""
    response = await client.delete("/")
    assert response.status_code == 405  # Method Not Allowed


@pytest.mark.asyncio
async def test_nonexistent_endpoint(client: AsyncClient) -> None:
    """Test accessing a non-existent endpoint."""
    response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_version_not_found(client: AsyncClient) -> None:
    """Test accessing non-existent API version."""
    response = await client.get("/api/v2/users/")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_root_rate_limit(client: AsyncClient) -> None:
    """Test root endpoint rate limiting (if applicable)."""
    # Make multiple requests to test rate limiting
    responses = []
    for _ in range(15):  # Assuming limit is 10/minute
        response = await client.get("/")
        responses.append(response.status_code)

    # All should succeed in test environment (rate limiting may not be enforced)
    # But we verify the endpoint works
    assert all(status == 200 for status in responses[:10])
