"""
Stats API - Heatmap, Streaks, Badges, and History.
"""

from datetime import UTC, datetime, timedelta, date
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Task, TaskStatus, User

router = APIRouter(prefix="/stats", tags=["stats"])

class StatsResponse(BaseModel):
    heatmap: dict[str, int]
    streak: dict[str, int]
    stats: dict[str, Any]
    badges: list[dict[str, Any]]
    history: list[dict[str, Any]]


@router.get("/", response_model=StatsResponse)
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch all completed tasks for the user
    result = await db.execute(
        select(Task.id, Task.title, Task.completed_at)
        .where(Task.owner_id == current_user.id)
        .where(Task.status == TaskStatus.DONE)
        .where(Task.completed_at.is_not(None))
        .order_by(Task.completed_at.desc())
    )
    completed_tasks = result.all()

    # Total completed
    total_completed = len(completed_tasks)
    
    # Heatmap data
    heatmap_data: dict[str, int] = {}
    completed_dates: set[date] = set()
    
    # History
    history = []
    
    for row in completed_tasks:
        dt = row.completed_at.astimezone(UTC).date()
        date_str = dt.isoformat()
        
        # Add to heatmap
        heatmap_data[date_str] = heatmap_data.get(date_str, 0) + 1
        completed_dates.add(dt)
        
        # Keep top 10 history
        if len(history) < 10:
            history.append({
                "id": str(row.id),
                "title": row.title,
                "completed_at": row.completed_at.isoformat()
            })

    # Total created tasks for completion rate
    total_tasks_result = await db.execute(
        select(func.count(Task.id)).where(Task.owner_id == current_user.id)
    )
    total_tasks = total_tasks_result.scalar() or 0
    completion_rate = round((total_completed / total_tasks * 100) if total_tasks > 0 else 0)

    # Calculate streaks
    current_streak = 0
    longest_streak = 0
    
    if completed_dates:
        sorted_dates = sorted(list(completed_dates), reverse=True)
        today = datetime.now(UTC).date()
        
        # Calculate current streak
        # Starting point is either today or yesterday
        check_date = today
        if sorted_dates[0] == today:
            current_streak = 1
            check_date = today - timedelta(days=1)
            idx = 1
        elif sorted_dates[0] == today - timedelta(days=1):
            current_streak = 1
            check_date = today - timedelta(days=2)
            idx = 1
        else:
            idx = 0 # No current streak
            
        while idx < len(sorted_dates) and sorted_dates[idx] == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
            idx += 1
            
        # Calculate longest streak
        longest_streak = 1
        current_calc_streak = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == sorted_dates[i-1] - timedelta(days=1):
                current_calc_streak += 1
                if current_calc_streak > longest_streak:
                    longest_streak = current_calc_streak
            else:
                current_calc_streak = 1

    # Badges calculation
    badges = []
    if total_completed >= 1:
        badges.append({"id": "first_task", "name": "First Step", "description": "Completed your first task!", "icon": "🎯", "unlocked_at": completed_tasks[-1].completed_at.isoformat() if completed_tasks else None})
    if total_completed >= 10:
        badges.append({"id": "ten_tasks", "name": "Task Master", "description": "Completed 10 tasks.", "icon": "⭐", "unlocked_at": None})
    if total_completed >= 100:
        badges.append({"id": "hundred_tasks", "name": "Centurion", "description": "Completed 100 tasks.", "icon": "👑", "unlocked_at": None})
    
    if longest_streak >= 3:
        badges.append({"id": "streak_3", "name": "On Fire", "description": "Hit a 3-day streak.", "icon": "🔥", "unlocked_at": None})
    if longest_streak >= 7:
        badges.append({"id": "streak_7", "name": "Unstoppable", "description": "Hit a 7-day streak.", "icon": "⚡", "unlocked_at": None})
    if longest_streak >= 30:
        badges.append({"id": "streak_30", "name": "Legend", "description": "Hit a 30-day streak.", "icon": "🏆", "unlocked_at": None})

    return StatsResponse(
        heatmap=heatmap_data,
        streak={"current": current_streak, "longest": longest_streak},
        stats={"total_completed": total_completed, "completion_rate": completion_rate, "total_created": total_tasks},
        badges=badges,
        history=history,
    )
