from __future__ import annotations

import unittest

from fastapi import HTTPException

from app.api.saved_games import DEFAULT_USER_ID, resolve_request_user_id
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
    def test_guest_request_uses_explicit_user_id_without_token(self) -> None:
        user_id = resolve_request_user_id(" guest-123 ", None, FakeDb({}), FakeSettings())

        self.assertEqual(user_id, "guest-123")

    def test_guest_request_falls_back_to_default_user_id(self) -> None:
        user_id = resolve_request_user_id(" ", None, FakeDb({}), FakeSettings())

        self.assertEqual(user_id, DEFAULT_USER_ID)

    def test_bearer_token_overrides_explicit_user_id(self) -> None:
        token = create_access_token("player-a", FakeSettings.auth_secret, 60)
        user = User(
            id="player-a",
            email="player-a@example.com",
            display_name="Player A",
            role="player",
            password_hash="hash",
            is_active=True,
        )

        user_id = resolve_request_user_id("player-b", f"Bearer {token}", FakeDb({"player-a": user}), FakeSettings())

        self.assertEqual(user_id, "player-a")

    def test_invalid_bearer_token_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as error:
            resolve_request_user_id("player-b", "Bearer invalid-token", FakeDb({}), FakeSettings())

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
            resolve_request_user_id("player-b", f"Bearer {token}", FakeDb({"player-a": user}), FakeSettings())

        self.assertEqual(error.exception.status_code, 401)
