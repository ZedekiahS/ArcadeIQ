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

    def test_collections_routes_are_registered(self) -> None:
        from app.main import app

        methods = set()
        for route in app.routes:
            if getattr(route, "path", None) == "/api/collections":
                methods.update(getattr(route, "methods", set()))

        self.assertIn("GET", methods)
        self.assertIn("POST", methods)

    def test_collection_detail_routes_are_registered(self) -> None:
        from app.main import app

        methods = set()
        for route in app.routes:
            if getattr(route, "path", None) == "/api/collections/{collection_id}":
                methods.update(getattr(route, "methods", set()))

        self.assertIn("PATCH", methods)
        self.assertIn("DELETE", methods)

    def test_users_routes_are_registered(self) -> None:
        from app.main import app

        collection_methods = set()
        session_methods = set()
        for route in app.routes:
            if getattr(route, "path", None) == "/api/users":
                collection_methods.update(getattr(route, "methods", set()))
            if getattr(route, "path", None) == "/api/users/session":
                session_methods.update(getattr(route, "methods", set()))

        self.assertIn("GET", collection_methods)
        self.assertIn("POST", session_methods)

    def test_auth_routes_are_registered(self) -> None:
        from app.main import app

        login_methods = set()
        me_methods = set()
        for route in app.routes:
            if getattr(route, "path", None) == "/api/auth/login":
                login_methods.update(getattr(route, "methods", set()))
            if getattr(route, "path", None) == "/api/auth/me":
                me_methods.update(getattr(route, "methods", set()))

        self.assertIn("POST", login_methods)
        self.assertIn("GET", me_methods)
