"""add completed_at to tasks

Revision ID: 0002_completed_at
Revises: 0001_initial
Create Date: 2026-08-18

"""

from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "0002_completed_at"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.add_column("tasks", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column("tasks", "completed_at")
