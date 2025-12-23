"""Tests for User API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient) -> None:
    """Test creating a new user."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "name": "Test User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient) -> None:
    """Test creating a user with duplicate email."""
    # Create first user
    await client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "name": "User 1"},
    )

    # Try to create second user with same email
    response = await client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "name": "User 2"},
    )
    assert response.status_code == 400
    data = response.json()
    assert "already exists" in data["detail"]


@pytest.mark.asyncio
async def test_create_user_invalid_email(client: AsyncClient) -> None:
    """Test creating a user with invalid email."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "invalid-email", "name": "Test User"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient) -> None:
    """Test getting a user by ID."""
    # Create a user first
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "getuser@example.com", "name": "Get User"},
    )
    user_id = create_response.json()["id"]

    # Get the user
    response = await client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "getuser@example.com"


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient) -> None:
    """Test getting a non-existent user."""
    response = await client.get("/api/v1/users/99999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient) -> None:
    """Test listing users."""
    # Create some users
    await client.post(
        "/api/v1/users/",
        json={"email": "list1@example.com", "name": "List User 1"},
    )
    await client.post(
        "/api/v1/users/",
        json={"email": "list2@example.com", "name": "List User 2"},
    )

    # List users
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_list_users_pagination(client: AsyncClient) -> None:
    """Test listing users with pagination."""
    # Create users
    for i in range(5):
        await client.post(
            "/api/v1/users/",
            json={"email": f"page{i}@example.com", "name": f"Page User {i}"},
        )

    # Test pagination
    response = await client.get("/api/v1/users/?skip=2&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient) -> None:
    """Test updating a user."""
    # Create a user
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "update@example.com", "name": "Original Name"},
    )
    user_id = create_response.json()["id"]

    # Update the user
    response = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["email"] == "update@example.com"  # Email unchanged


@pytest.mark.asyncio
async def test_update_user_not_found(client: AsyncClient) -> None:
    """Test updating a non-existent user."""
    response = await client.patch(
        "/api/v1/users/99999",
        json={"name": "New Name"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient) -> None:
    """Test deleting a user."""
    # Create a user
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "delete@example.com", "name": "Delete User"},
    )
    user_id = create_response.json()["id"]

    # Delete the user
    response = await client.delete(f"/api/v1/users/{user_id}")
    assert response.status_code == 204

    # Verify user is deleted
    get_response = await client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_user_not_found(client: AsyncClient) -> None:
    """Test deleting a non-existent user."""
    response = await client.delete("/api/v1/users/99999")
    assert response.status_code == 404
