from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db.database import get_db
from app.db.models import User
from app.schemas import AuthLoginRequest, AuthSessionOut, UserOut
from app.services.auth import create_access_token, verify_access_token, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=AuthSessionOut)
def login(
    request: AuthLoginRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    user = db.get(User, request.user_id.strip())
    if user is None or not user.is_active or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id or password")

    access_token = create_access_token(user.id, settings.auth_secret, settings.auth_token_ttl_seconds)
    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "expiresIn": settings.auth_token_ttl_seconds,
        "user": user,
    }


@router.get("/auth/me", response_model=UserOut)
def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    token = parse_bearer_token(authorization)
    user_id = verify_access_token(token, settings.auth_secret)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active")
    return user


def parse_bearer_token(authorization: str | None) -> str:
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expected bearer token")
    return token
