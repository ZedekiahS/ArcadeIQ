from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import SessionLocal
from app.db.models import Game, User
from app.services.auth import hash_password, verify_password


CATALOG_PATH = Path(__file__).resolve().parents[3] / "catalog" / "demo-catalog.json"


def load_seed_games() -> list[dict[str, Any]]:
    """Load the shared portfolio catalog and translate its public field names."""
    records = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return [
        {
            "id": record["id"],
            "name": record["name"],
            "price": record["price"],
            "rating": record["rating"],
            "review_count": record["reviewCount"],
            "release_year": record["releaseYear"],
            "developer": record["developer"],
            "publisher": record["publisher"],
            "tags": record["tags"],
            "summary": record["summary"],
            "revenue": record["revenue"],
            "ownership": record["ownership"],
        }
        for record in records
    ]


# Portfolio demo metrics, not live storefront data.
SEED_GAMES = load_seed_games()


def seed_games(db: Session) -> None:
    for game_data in SEED_GAMES:
        game = db.get(Game, game_data["id"])
        if game is None:
            db.add(Game(**game_data))
        else:
            for key, value in game_data.items():
                setattr(game, key, value)
    db.commit()


def seed_users(db: Session) -> None:
    settings = get_settings()
    admin_user_id = settings.admin_user_id or "local-admin"
    admin_email = settings.admin_email or "admin@game-discovery-lens.local"
    admin_display_name = settings.admin_display_name or "Local Admin"
    admin_password = settings.admin_password

    user = db.get(User, admin_user_id)
    if user is None:
        db.add(
            User(
                id=admin_user_id,
                email=admin_email,
                display_name=admin_display_name,
                role="admin",
                password_hash=hash_password(admin_password),
                is_active=True,
            )
        )
    else:
        user.email = admin_email
        user.display_name = admin_display_name
        user.role = "admin"
        user.is_active = True
        if not verify_password(admin_password, user.password_hash):
            user.password_hash = hash_password(admin_password)

    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed_games(db)
        seed_users(db)
        print(f"Seeded {len(SEED_GAMES)} games.")
        print("Seeded local admin user.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
