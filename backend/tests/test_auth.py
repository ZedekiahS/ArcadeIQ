from __future__ import annotations

import unittest

from app.services.auth import hash_password, verify_password


class AuthTests(unittest.TestCase):
    def test_password_hash_verifies_original_password(self) -> None:
        password_hash = hash_password("local-password")

        self.assertTrue(verify_password("local-password", password_hash))
        self.assertFalse(verify_password("wrong-password", password_hash))

    def test_empty_hash_does_not_verify(self) -> None:
        self.assertFalse(verify_password("local-password", None))
