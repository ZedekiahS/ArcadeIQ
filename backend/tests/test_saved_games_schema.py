from __future__ import annotations

import unittest

from app.schemas import CollectionCreateRequest, CollectionUpdateRequest, SavedGameRequest, UserSessionRequest


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
