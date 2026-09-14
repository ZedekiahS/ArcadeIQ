from __future__ import annotations

import unittest

from fastapi import HTTPException

from app.api.auth import get_current_user
from app.db.models import User
from app.services.auth import create_access_token


class FakeDb:
    def __init__(self, users: dict[str, User]) -> None:
        self.users = users

    def get(self, model: object, primary_key: str) -> User | None:
        if model is User:
            return self.users.get(primary_key)
        return None


class FakeSettings:
    auth_secret = "test-secret"


class SavedGamesAuthTests(unittest.TestCase):
    def test_missing_token_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as error:
            get_current_user(None, FakeDb({}), FakeSettings())
        self.assertEqual(error.exception.status_code, 401)

    def test_missing_token_user_is_rejected(self) -> None:
        token = create_access_token("missing-player", FakeSettings.auth_secret, 60)
        with self.assertRaises(HTTPException) as error:
            get_current_user(f"Bearer {token}", FakeDb({}), FakeSettings())
        self.assertEqual(error.exception.status_code, 401)

    def test_bearer_token_resolves_current_user(self) -> None:
        token = create_access_token("player-a", FakeSettings.auth_secret, 60)
        user = User(
            id="player-a",
            email="player-a@example.com",
            display_name="Player A",
            role="player",
            password_hash="hash",
            is_active=True,
        )

        current_user = get_current_user(f"Bearer {token}", FakeDb({"player-a": user}), FakeSettings())

        self.assertIs(current_user, user)

    def test_invalid_bearer_token_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as error:
            get_current_user("Bearer invalid-token", FakeDb({}), FakeSettings())

        self.assertEqual(error.exception.status_code, 401)

    def test_inactive_token_user_is_rejected(self) -> None:
        token = create_access_token("player-a", FakeSettings.auth_secret, 60)
        user = User(
            id="player-a",
            email="player-a@example.com",
            display_name="Player A",
            role="player",
            password_hash="hash",
            is_active=False,
        )

        with self.assertRaises(HTTPException) as error:
            get_current_user(f"Bearer {token}", FakeDb({"player-a": user}), FakeSettings())

        self.assertEqual(error.exception.status_code, 401)
