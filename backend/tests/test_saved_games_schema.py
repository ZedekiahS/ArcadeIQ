from __future__ import annotations

import unittest

from app.schemas import SavedGameRequest


class SavedGamesSchemaTests(unittest.TestCase):
    def test_saved_game_request_accepts_frontend_aliases(self) -> None:
        request = SavedGameRequest.model_validate({"gameId": 2, "userId": "demo-user"})

        self.assertEqual(request.game_id, 2)
        self.assertEqual(request.user_id, "demo-user")
