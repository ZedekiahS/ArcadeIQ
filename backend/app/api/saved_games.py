from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.db.models import Game, SavedGame
from app.schemas import SavedGameOut, SavedGameRequest, ShortlistInsightsOut
from app.services.shortlist_insights import build_shortlist_insights

router = APIRouter(tags=["saved-games"])

DEFAULT_USER_ID = "demo-user"


@router.get("/saved-games", response_model=list[SavedGameOut])
def list_saved_games(
    user_id: str = Query(default=DEFAULT_USER_ID, alias="userId"),
    db: Session = Depends(get_db),
) -> list[SavedGame]:
    return get_saved_games_for_user(db, user_id)


@router.get("/saved-games/insights", response_model=ShortlistInsightsOut)
def get_saved_games_insights(
    user_id: str = Query(default=DEFAULT_USER_ID, alias="userId"),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    saved_games = get_saved_games_for_user(db, user_id)
    return build_shortlist_insights(saved_games, user_id)


def get_saved_games_for_user(db: Session, user_id: str) -> list[SavedGame]:
    stmt = (
        select(SavedGame)
        .options(joinedload(SavedGame.game))
        .where(SavedGame.user_id == user_id)
        .order_by(SavedGame.created_at.desc(), SavedGame.id.desc())
    )
    return list(db.scalars(stmt).all())


@router.post("/saved-games", response_model=SavedGameOut, status_code=201)
def save_game(request: SavedGameRequest, db: Session = Depends(get_db)) -> SavedGame:
    game = db.get(Game, request.game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    existing = get_saved_game(db, request.user_id, request.game_id)
    if existing is not None:
        return existing

    saved = SavedGame(user_id=request.user_id, game_id=request.game_id)
    db.add(saved)
    db.commit()

    created = get_saved_game(db, request.user_id, request.game_id)
    if created is None:
        raise HTTPException(status_code=500, detail="Saved game was not persisted")
    return created


@router.delete("/saved-games", status_code=204, response_class=Response)
def clear_saved_games(
    user_id: str = Query(default=DEFAULT_USER_ID, alias="userId"),
    db: Session = Depends(get_db),
) -> Response:
    db.execute(delete(SavedGame).where(SavedGame.user_id == user_id))
    db.commit()
    return Response(status_code=204)


@router.delete("/saved-games/{game_id}", status_code=204, response_class=Response)
def delete_saved_game(
    game_id: int,
    user_id: str = Query(default=DEFAULT_USER_ID, alias="userId"),
    db: Session = Depends(get_db),
) -> Response:
    saved = db.scalar(select(SavedGame).where(SavedGame.user_id == user_id, SavedGame.game_id == game_id))
    if saved is not None:
        db.delete(saved)
        db.commit()
    return Response(status_code=204)


def get_saved_game(db: Session, user_id: str, game_id: int) -> SavedGame | None:
    return db.scalar(
        select(SavedGame)
        .options(joinedload(SavedGame.game))
        .where(SavedGame.user_id == user_id, SavedGame.game_id == game_id)
    )
