"""
Pydantic schemas for request/response validation.
Keeping schemas separate from ORM models is a key security practice:
it prevents accidentally exposing internal fields (e.g., hashed_password).
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import TaskPriority, TaskStatus

# ── Auth ──────────────────────────────────────────────────────────────────────


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """Enforce at least one digit and one uppercase letter."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    """Returned on login. Access token is short-lived; refresh rotates it."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Tasks ─────────────────────────────────────────────────────────────────────


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: date | None = None


class TaskUpdate(BaseModel):
    """All fields optional — supports PATCH semantics."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
