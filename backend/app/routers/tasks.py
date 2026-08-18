"""
Task CRUD routes — all scoped to the authenticated user via owner_id filter.

Every query filters by owner_id = current_user.id, which provides
object-level authorization. This prevents IDOR (Insecure Direct Object
Reference, OWASP A01) — user A cannot read/modify user B's tasks even if
they know the UUID, because the DB query enforces ownership.
"""

import uuid
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Task, User, TaskStatus
from app.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Task]:
    """List all tasks owned by the current user."""
    result = await db.execute(
        select(Task)
        .where(Task.owner_id == current_user.id)
        .order_by(Task.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Create a new task owned by the current user."""
    data = payload.model_dump()
    if data.get("status") == TaskStatus.DONE:
        data["completed_at"] = datetime.now(UTC)
    task = Task(**data, owner_id=current_user.id)
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Fetch a single task, enforcing ownership."""
    task = await _get_owned_task(task_id, current_user, db)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    """Partial update — only fields provided in the request body are changed."""
    task = await _get_owned_task(task_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    
    # Handle completed_at logic
    if "status" in update_data:
        if update_data["status"] == TaskStatus.DONE and task.status != TaskStatus.DONE:
            update_data["completed_at"] = datetime.now(UTC)
        elif update_data["status"] != TaskStatus.DONE:
            update_data["completed_at"] = None

    for field, value in update_data.items():
        setattr(task, field, value)
    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a task, enforcing ownership."""
    task = await _get_owned_task(task_id, current_user, db)
    await db.delete(task)


# ── Helper ────────────────────────────────────────────────────────────────────


async def _get_owned_task(
    task_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Task:
    """
    Fetch a task by ID *and* owner_id simultaneously.
    Returning 404 (not 403) for tasks owned by others prevents confirming
    that the UUID exists at all — avoids leaking resource metadata.
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return task
