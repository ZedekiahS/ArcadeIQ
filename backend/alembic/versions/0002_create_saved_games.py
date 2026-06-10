"""create saved games

Revision ID: 0002_create_saved_games
Revises: 0001_create_games
Create Date: 2026-06-09
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_create_saved_games"
down_revision: str | None = "0001_create_games"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saved_games",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=120), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "game_id", name="uq_saved_games_user_game"),
    )
    op.create_index("ix_saved_games_game_id", "saved_games", ["game_id"], unique=False)
    op.create_index("ix_saved_games_user_id", "saved_games", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_saved_games_user_id", table_name="saved_games")
    op.drop_index("ix_saved_games_game_id", table_name="saved_games")
    op.drop_table("saved_games")
