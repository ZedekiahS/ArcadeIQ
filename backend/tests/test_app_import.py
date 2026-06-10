from __future__ import annotations

import unittest


class AppImportTests(unittest.TestCase):
    def test_fastapi_app_imports(self) -> None:
        from app.main import app

        self.assertEqual(app.title, "ArcadeIQ API")
