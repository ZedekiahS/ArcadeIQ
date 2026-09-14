from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas import UserOut

router = APIRouter(tags=["users"])


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


def require_admin_user(user: User) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return user


def require_self_or_admin(user: User, target_user_id: str) -> User:
    if user.role == "admin" or user.id == target_user_id:
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile is private")
