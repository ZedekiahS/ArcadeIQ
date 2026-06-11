from __future__ import annotations

import unittest

from app.schemas import CollectionCreateRequest, SavedGameRequest


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
