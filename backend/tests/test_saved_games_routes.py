from __future__ import annotations

import unittest
from unittest.mock import Mock

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db
from app.main import app
from app.services.auth import create_access_token


class TestSettings:
    auth_secret = "route-tests-only-secret"
    auth_token_ttl_seconds = 3600


PROTECTED_REQUESTS = (
    ("GET", "/api/collections", None),
    ("POST", "/api/collections", {"name": "Wishlist"}),
    ("PATCH", "/api/collections/1", {"name": "Renamed"}),
    ("DELETE", "/api/collections/1", None),
    ("GET", "/api/saved-games", None),
    ("GET", "/api/saved-games/insights", None),
    ("POST", "/api/saved-games", {"gameId": 1}),
    ("DELETE", "/api/saved-games", None),
    ("DELETE", "/api/saved-games/1", None),
)


class SavedGamesRouteAuthTests(unittest.TestCase):
    def setUp(self) -> None:
        self.db = Mock(spec=Session)
        for method in ("get", "scalar", "scalars", "add", "execute", "delete", "commit", "refresh"):
            getattr(self.db, method).side_effect = AssertionError("Unauthenticated request accessed the database")
        self.overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_settings] = TestSettings
        self.client = TestClient(app, raise_server_exceptions=False)
        self.addCleanup(self.client.close)
        self.addCleanup(self.restore_overrides)

    def restore_overrides(self) -> None:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.overrides)

    def test_every_collection_and_saved_game_route_requires_a_token_before_database_access(self) -> None:
        for method, path, body in PROTECTED_REQUESTS:
            with self.subTest(method=method, path=path):
                self.db.reset_mock()
                response = self.client.request(method, path, params={"userId": "player-a"}, json=body)
                self.assertEqual(response.status_code, 401, response.text)
                self.assertEqual(self.db.mock_calls, [])

    def test_expired_and_invalid_tokens_are_rejected_before_database_access(self) -> None:
        expired_token = create_access_token("player-a", TestSettings.auth_secret, -60)
        for token in (expired_token, "invalid-token"):
            for method, path, body in PROTECTED_REQUESTS:
                with self.subTest(token=token, method=method, path=path):
                    self.db.reset_mock()
                    response = self.client.request(
                        method, path, json=body, headers={"Authorization": f"Bearer {token}"}
                    )
                    self.assertEqual(response.status_code, 401, response.text)
                    self.assertEqual(self.db.mock_calls, [])

    def test_guest_session_creation_is_not_available(self) -> None:
        response = self.client.post("/api/users/session", json={"userId": "guest-arbitrary"})
        self.assertIn(response.status_code, (404, 405), response.text)
        self.assertEqual(self.db.mock_calls, [])
