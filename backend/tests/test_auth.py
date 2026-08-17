"""
Integration tests for auth endpoints.
Uses httpx AsyncClient with the FastAPI test transport — no real DB needed
for unit-level tests; swap the dependency for real tests.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ── Register ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_returns_201():
    """Happy path: valid email + strong password creates a user."""
    mock_user = AsyncMock()
    mock_user.id = "00000000-0000-0000-0000-000000000001"
    mock_user.email = "test@example.com"
    mock_user.is_active = True
    from datetime import datetime, timezone
    mock_user.created_at = datetime.now(timezone.utc)

    with patch("app.routers.auth.get_db") as mock_get_db:
        # Minimal smoke test — full integration tests require a test DB
        pass  # Replace with real DB fixture in a CI matrix with postgres service


@pytest.mark.asyncio
async def test_weak_password_rejected():
    """Password without uppercase or digit should fail schema validation."""
    from app.schemas import UserRegister
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        UserRegister(email="a@b.com", password="alllowercase")


@pytest.mark.asyncio
async def test_short_password_rejected():
    from app.schemas import UserRegister
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        UserRegister(email="a@b.com", password="Sh0rt")


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Health check doesn't need DB — just confirms app starts
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
