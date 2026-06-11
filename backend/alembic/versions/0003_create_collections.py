"""create collections

Revision ID: 0003_create_collections
Revises: 0002_create_saved_games
Create Date: 2026-06-11
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_create_collections"
down_revision: str | None = "0002_create_saved_games"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "collections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_collections_user_name"),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"], unique=False)

    op.add_column("saved_games", sa.Column("collection_id", sa.Integer(), nullable=True))
    op.create_index("ix_saved_games_collection_id", "saved_games", ["collection_id"], unique=False)
    op.create_foreign_key(
        "fk_saved_games_collection_id_collections",
        "saved_games",
        "collections",
        ["collection_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.execute(
        """
        INSERT INTO collections (user_id, name, description)
        SELECT DISTINCT user_id, 'Default Shortlist', 'Imported saved games'
        FROM saved_games
        ON CONFLICT (user_id, name) DO NOTHING
        """
    )
    op.execute(
        """
        UPDATE saved_games AS saved
        SET collection_id = collections.id
        FROM collections
        WHERE collections.user_id = saved.user_id
          AND collections.name = 'Default Shortlist'
        """
    )

    op.alter_column("saved_games", "collection_id", existing_type=sa.Integer(), nullable=False)
    op.drop_constraint("uq_saved_games_user_game", "saved_games", type_="unique")
    op.create_unique_constraint(
        "uq_saved_games_collection_game",
        "saved_games",
        ["collection_id", "game_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_saved_games_collection_game", "saved_games", type_="unique")
    op.create_unique_constraint("uq_saved_games_user_game", "saved_games", ["user_id", "game_id"])
    op.drop_constraint("fk_saved_games_collection_id_collections", "saved_games", type_="foreignkey")
    op.drop_index("ix_saved_games_collection_id", table_name="saved_games")
    op.drop_column("saved_games", "collection_id")
    op.drop_index("ix_collections_user_id", table_name="collections")
    op.drop_table("collections")
