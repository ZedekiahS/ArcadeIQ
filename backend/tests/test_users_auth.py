from __future__ import annotations

import unittest

from fastapi import HTTPException

from app.api.users import require_admin_user, require_self_or_admin
from app.db.models import User


def make_user(user_id: str, role: str) -> User:
    return User(
        id=user_id,
        email=f"{user_id}@example.com",
        display_name=user_id,
        role=role,
        password_hash="hash",
        is_active=True,
    )


class UsersAuthTests(unittest.TestCase):
    def test_require_admin_user_allows_admin(self) -> None:
        admin = make_user("admin", "admin")

        self.assertIs(require_admin_user(admin), admin)

    def test_require_admin_user_rejects_player(self) -> None:
        with self.assertRaises(HTTPException) as error:
            require_admin_user(make_user("player", "player"))

        self.assertEqual(error.exception.status_code, 403)

    def test_require_self_or_admin_allows_current_user(self) -> None:
        player = make_user("player", "player")

        self.assertIs(require_self_or_admin(player, "player"), player)

    def test_require_self_or_admin_allows_admin_for_other_user(self) -> None:
        admin = make_user("admin", "admin")

        self.assertIs(require_self_or_admin(admin, "player"), admin)

    def test_require_self_or_admin_rejects_other_player(self) -> None:
        with self.assertRaises(HTTPException) as error:
            require_self_or_admin(make_user("player-a", "player"), "player-b")

        self.assertEqual(error.exception.status_code, 403)
