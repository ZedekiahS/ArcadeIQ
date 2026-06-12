from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas import UserOut, UserSessionRequest

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    stmt = select(User).order_by(User.role.asc(), User.created_at.asc(), User.id.asc())
    return list(db.scalars(stmt).all())


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/session", response_model=UserOut, status_code=201)
def ensure_session_user(request: UserSessionRequest, db: Session = Depends(get_db)) -> User:
    user_id = request.user_id.strip()
    if not user_id:
        raise HTTPException(status_code=400, detail="User id is required")

    existing = db.get(User, user_id)
    if existing is not None:
        return existing

    user = User(
        id=user_id,
        email=None,
        display_name=request.display_name.strip() if request.display_name else format_guest_display_name(user_id),
        role="guest",
        password_hash=None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def format_guest_display_name(user_id: str) -> str:
    suffix = user_id.removeprefix("guest-")
    return f"Guest {suffix[:8]}" if suffix else "Guest User"
