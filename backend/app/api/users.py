from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas import UserOut, UserSessionRequest

router = APIRouter(tags=["users"])
GUEST_SESSION_PREFIX = "guest-"


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[User]:
    require_admin_user(current_user)
    stmt = select(User).order_by(User.role.asc(), User.created_at.asc(), User.id.asc())
    return list(db.scalars(stmt).all())


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    require_self_or_admin(current_user, user_id)
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/session", response_model=UserOut, status_code=201)
def ensure_session_user(request: UserSessionRequest, db: Session = Depends(get_db)) -> User:
    user_id = validate_guest_session_user_id(request.user_id)

    existing = db.get(User, user_id)
    if existing is not None:
        if existing.role != "guest":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guest session cannot use account id")
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


def require_admin_user(user: User) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return user


def require_self_or_admin(user: User, target_user_id: str) -> User:
    if user.role == "admin" or user.id == target_user_id:
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile is private")


def validate_guest_session_user_id(user_id: str) -> str:
    normalized_user_id = user_id.strip()
    if not normalized_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User id is required")
    if not normalized_user_id.startswith(GUEST_SESSION_PREFIX):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guest session id is required")
    return normalized_user_id


def format_guest_display_name(user_id: str) -> str:
    suffix = user_id.removeprefix("guest-")
    return f"Guest {suffix[:8]}" if suffix else "Guest User"
