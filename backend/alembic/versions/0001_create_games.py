"""create games

Revision ID: 0001_create_games
Revises:
Create Date: 2026-06-09
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_create_games"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "games",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False),
        sa.Column("release_year", sa.Integer(), nullable=False),
        sa.Column("developer", sa.String(length=120), nullable=False),
        sa.Column("publisher", sa.String(length=120), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("revenue", sa.Integer(), nullable=False),
        sa.Column("ownership", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_games_name", "games", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_games_name", table_name="games")
    op.drop_table("games")
