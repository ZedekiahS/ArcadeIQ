from __future__ import annotations

import unittest

from pydantic import ValidationError

from app.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    CollectionCreateRequest,
    CollectionUpdateRequest,
    SavedGameRequest,
)


class SavedGamesSchemaTests(unittest.TestCase):
    def test_saved_game_request_accepts_frontend_aliases(self) -> None:
        request = SavedGameRequest.model_validate({"gameId": 2, "collectionId": 4})

        self.assertEqual(request.game_id, 2)
        self.assertEqual(request.collection_id, 4)

    def test_collection_create_request_accepts_frontend_aliases(self) -> None:
        request = CollectionCreateRequest.model_validate({"name": "Wishlist"})

        self.assertEqual(request.name, "Wishlist")
        self.assertEqual(request.description, "")

    def test_collection_update_request_accepts_frontend_aliases(self) -> None:
        request = CollectionUpdateRequest.model_validate({"name": "Research"})

        self.assertEqual(request.name, "Research")
        self.assertIsNone(request.description)

    def test_collection_and_saved_game_inputs_reject_client_supplied_owners(self) -> None:
        for schema, fields in (
            (SavedGameRequest, {"gameId": 2}),
            (CollectionCreateRequest, {"name": "Wishlist"}),
            (CollectionUpdateRequest, {"name": "Research"}),
        ):
            for owner_field in ("userId", "user_id"):
                with self.subTest(schema=schema.__name__, owner_field=owner_field):
                    with self.assertRaises(ValidationError):
                        schema.model_validate({**fields, owner_field: "another-player"})

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
