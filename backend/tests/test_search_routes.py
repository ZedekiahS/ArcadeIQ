from __future__ import annotations

from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.main import app


class SearchRouteTests(unittest.TestCase):
    def test_unavailable_provider_without_fallback_returns_503(self) -> None:
        db = Mock(spec=Session)
        db.execute.return_value.all.return_value = [("Celeste", ["Platformer"])]
        original = app.dependency_overrides.copy()
        app.dependency_overrides[get_db] = lambda: db
        try:
            with TestClient(app) as client, patch("app.api.games.get_settings", return_value=SimpleNamespace(
                ai_enabled=True, ai_provider="deepseek", ai_fallback_to_rules=False, deepseek_api_key="",
            )), patch("app.services.ai_search.urllib.request.urlopen") as provider:
                response = client.post("/api/search", json={"query": "Celeste"})
            self.assertEqual(response.status_code, 503, response.text)
            self.assertEqual(response.json()["detail"], "DeepSeek API key is not configured.")
            provider.assert_not_called()
            db.scalars.assert_not_called()
        finally:
            app.dependency_overrides.clear()
            app.dependency_overrides.update(original)
