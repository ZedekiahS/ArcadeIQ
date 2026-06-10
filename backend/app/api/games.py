from __future__ import annotations

import re

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Game
from app.schemas import GameOut, SearchRequest, SearchResponse

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
    intent = parse_search_intent(request.query, available_tags)

    stmt: Select[tuple[Game]] = select(Game).order_by(Game.name)
    stmt = apply_intent_filters(stmt, intent)

    return {
        "intent": intent,
        "games": list(db.scalars(stmt).all()),
        "source": "rules",
    }


def apply_intent_filters(stmt: Select[tuple[Game]], intent: dict[str, object]) -> Select[tuple[Game]]:
    stmt = stmt.where(Game.price <= float(intent["max_price"]))
    stmt = stmt.where(Game.rating >= float(intent["min_rating"]))

    if intent["has_reviews"]:
        stmt = stmt.where(Game.review_count > 0)

    for tag in intent["tags"]:
        stmt = stmt.where(Game.tags.contains([tag]))

    return stmt


def parse_search_intent(query: str, available_tags: list[str]) -> dict[str, object]:
    text = query.lower()
    intent: dict[str, object] = {
        "max_price": 70,
        "min_rating": 0,
        "has_reviews": False,
        "tags": [],
        "mode": "player",
    }

    explicit_price = re.search(r"(?:under|below|less than)\s+\$?(\d+)", text)
    if explicit_price:
        intent["max_price"] = int(explicit_price.group(1))
    elif "cheap" in text or "deal" in text:
        intent["max_price"] = 35

    if "highly rated" in text or "top rated" in text:
        intent["min_rating"] = 4.4
        intent["has_reviews"] = True
    elif "good reviews" in text:
        intent["has_reviews"] = True
    elif "review" in text or "rated" in text:
        intent["has_reviews"] = True

    if "developer" in text or "catalog" in text or "revenue" in text:
        intent["mode"] = "developer"

    matched_tags: set[str] = set()
    for tag in available_tags:
        normalized = tag.lower()
        single_word = " " not in normalized
        if normalized in text or (single_word and normalized.split(" ")[0] in text):
            matched_tags.add(tag)

    if "story" in text:
        matched_tags.add("Story Rich")
    if "horror" in text:
        matched_tags.add("Survival Horror")
    if "multiplayer" in text:
        matched_tags.add("Multiplayer")

    intent["tags"] = prioritize_tags(sorted(matched_tags), text)
    return intent


def prioritize_tags(tags: list[str], text: str) -> list[str]:
    priority: list[str] = []

    def push(tag: str) -> None:
        if tag in tags and tag not in priority:
            priority.append(tag)

    if "multiplayer" in text:
        push("Multiplayer")
    if "survival" in text:
        push("Survival")
    if "story" in text:
        push("Story Rich")
    if "exploration" in text:
        push("Exploration")
    if "puzzle" in text:
        push("Puzzle")

    for tag in tags:
        push(tag)

    return priority[:3]
