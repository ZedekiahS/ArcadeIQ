from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db
from app.db.models import Game
from app.schemas import GameOut, SearchRequest, SearchResponse
from app.services.ai_search import AIProviderError, resolve_search_intent
from app.services.search_intent import SearchIntent

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


@router.post("/search", response_model=SearchResponse)
def search_games(request: SearchRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    available_tags = sorted({tag for game_tags in db.scalars(select(Game.tags)).all() for tag in game_tags})
    try:
        result = resolve_search_intent(request.query, available_tags, get_settings())
    except AIProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    stmt: Select[tuple[Game]] = select(Game).order_by(Game.name)
    stmt = apply_intent_filters(stmt, result.intent)

    return {
        "intent": result.intent,
        "games": list(db.scalars(stmt).all()),
        "source": result.source,
    }


def apply_intent_filters(stmt: Select[tuple[Game]], intent: SearchIntent) -> Select[tuple[Game]]:
    stmt = stmt.where(Game.price <= float(intent["max_price"]))
    stmt = stmt.where(Game.rating >= float(intent["min_rating"]))

    if intent["has_reviews"]:
        stmt = stmt.where(Game.review_count > 0)

    for tag in intent["tags"]:
        stmt = stmt.where(Game.tags.contains([tag]))

    return stmt
