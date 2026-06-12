from __future__ import annotations

import unittest

from app.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    CollectionCreateRequest,
    CollectionUpdateRequest,
    SavedGameRequest,
    UserSessionRequest,
)


class SavedGamesSchemaTests(unittest.TestCase):
    def test_saved_game_request_accepts_frontend_aliases(self) -> None:
        request = SavedGameRequest.model_validate({"gameId": 2, "userId": "demo-user", "collectionId": 4})

        self.assertEqual(request.game_id, 2)
        self.assertEqual(request.user_id, "demo-user")
        self.assertEqual(request.collection_id, 4)

    def test_collection_create_request_accepts_frontend_aliases(self) -> None:
        request = CollectionCreateRequest.model_validate({"userId": "demo-user", "name": "Wishlist"})

        self.assertEqual(request.user_id, "demo-user")
        self.assertEqual(request.name, "Wishlist")
        self.assertEqual(request.description, "")

    def test_collection_update_request_accepts_frontend_aliases(self) -> None:
        request = CollectionUpdateRequest.model_validate({"userId": "demo-user", "name": "Research"})

        self.assertEqual(request.user_id, "demo-user")
        self.assertEqual(request.name, "Research")
        self.assertIsNone(request.description)

    def test_user_session_request_accepts_frontend_aliases(self) -> None:
        request = UserSessionRequest.model_validate({"userId": "guest-1234", "displayName": "Guest 1234"})

        self.assertEqual(request.user_id, "guest-1234")
        self.assertEqual(request.display_name, "Guest 1234")

    def test_auth_login_request_accepts_frontend_aliases(self) -> None:
        request = AuthLoginRequest.model_validate({"userId": "local-admin", "password": "local-password"})

        self.assertEqual(request.user_id, "local-admin")
        self.assertEqual(request.password, "local-password")

    def test_auth_register_request_accepts_frontend_aliases(self) -> None:
        request = AuthRegisterRequest.model_validate(
            {"email": "player@example.com", "displayName": "Player One", "password": "local-password"}
        )

        self.assertEqual(request.email, "player@example.com")
        self.assertEqual(request.display_name, "Player One")
        self.assertEqual(request.password, "local-password")
