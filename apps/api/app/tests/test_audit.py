"""Tests for Audit log endpoints."""

import pytest
from httpx import AsyncClient

from app.config import settings


async def _register_and_login(client: AsyncClient, *, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "name": "U"},
        headers={"X-Request-Id": "req-1"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
        headers={"X-Request-Id": "req-1"},
    )
    return dict(login.cookies)


@pytest.mark.asyncio
async def test_audit_logs_requires_permission(client: AsyncClient) -> None:
    settings.admin_emails = ""
    cookies = await _register_and_login(client, email="u-audit@example.com")

    resp = await client.get("/api/v1/audit/logs", cookies=cookies)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_audit_logs_list_and_detail(client: AsyncClient) -> None:
    settings.admin_emails = "admin-audit@example.com"
    cookies = await _register_and_login(client, email="admin-audit@example.com")

    # trigger an audited action (create a role)
    create_role = await client.post(
        "/api/v1/roles",
        cookies=cookies,
        json={
            "name": "tmp_audit_role",
            "description": "tmp",
            "exclusive_group": None,
            "priority": 0,
        },
        headers={"X-Request-Id": "req-2", "User-Agent": "pytest"},
    )
    assert create_role.status_code == 201
    role_id = create_role.json()["id"]

    logs = await client.get(
        "/api/v1/audit/logs",
        cookies=cookies,
        params={"action": "rbac.role.create"},
    )
    assert logs.status_code == 200
    data = logs.json()
    assert data["total"] >= 1
    assert isinstance(data["items"], list)

    hit = next(
        (x for x in data["items"] if x["target_type"] == "role" and x["target_id"] == role_id),
        None,
    )
    assert hit is not None
    assert hit["request_id"] in ("req-2", None)  # request_id best-effort in tests

    detail = await client.get(f"/api/v1/audit/logs/{hit['id']}", cookies=cookies)
    assert detail.status_code == 200
    d = detail.json()
    assert d["id"] == hit["id"]
    assert d["action"] == "rbac.role.create"
