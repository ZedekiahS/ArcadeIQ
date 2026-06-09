from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Game
from app.schemas import GameOut

router = APIRouter(tags=["games"])


@router.get("/games", response_model=list[GameOut])
def list_games(
    max_price: float | None = Query(default=None, ge=0),
    tag: str | None = Query(default=None),
    has_reviews: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Game]:
    stmt: Select[tuple[Game]] = select(Game).order_by(Game.name)

    if max_price is not None:
        stmt = stmt.where(Game.price <= max_price)
    if tag:
        stmt = stmt.where(Game.tags.contains([tag]))
    if has_reviews:
        stmt = stmt.where(Game.review_count > 0)

    return list(db.scalars(stmt).all())
