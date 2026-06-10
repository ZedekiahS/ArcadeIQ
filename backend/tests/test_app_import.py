from __future__ import annotations

import unittest


class AppImportTests(unittest.TestCase):
    def test_fastapi_app_imports(self) -> None:
        from app.main import app

        self.assertEqual(app.title, "ArcadeIQ API")

    def test_clear_saved_games_route_is_registered(self) -> None:
        from app.main import app

        methods = set()
        for route in app.routes:
            if getattr(route, "path", None) == "/api/saved-games":
                methods.update(getattr(route, "methods", set()))

        self.assertIn("DELETE", methods)
