from __future__ import annotations

import unittest
from types import SimpleNamespace

from app.services.ai_search import resolve_search_intent

AVAILABLE_TAGS = ["Exploration", "Multiplayer", "Story Rich", "Survival"]


class AISearchTests(unittest.TestCase):
    def test_disabled_ai_uses_rules_provider(self) -> None:
        settings = SimpleNamespace(
            ai_enabled=False,
            ai_provider="deepseek",
            ai_fallback_to_rules=True,
            deepseek_api_key="",
        )

        result = resolve_search_intent("Find cheap multiplayer survival games", AVAILABLE_TAGS, settings)

        self.assertEqual(result.source, "rules")
        self.assertEqual(result.intent["tags"], ["Multiplayer", "Survival"])

    def test_deepseek_without_key_falls_back_to_rules(self) -> None:
        settings = SimpleNamespace(
            ai_enabled=True,
            ai_provider="deepseek",
            ai_fallback_to_rules=True,
            deepseek_api_key="",
        )

        result = resolve_search_intent("Show highly rated story rich games under 25 dollars", AVAILABLE_TAGS, settings)

        self.assertEqual(result.source, "rules")
        self.assertEqual(result.intent["max_price"], 25)
        self.assertEqual(result.intent["tags"], ["Story Rich"])
