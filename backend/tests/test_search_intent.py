from __future__ import annotations

import unittest

from app.api.games import parse_search_intent

AVAILABLE_TAGS = [
    "Adventure",
    "Exploration",
    "Metroidvania",
    "Multiplayer",
    "Puzzle",
    "Story Rich",
    "Survival",
    "Survival Horror",
]


class SearchIntentTests(unittest.TestCase):
    def test_parse_story_rich_budget_query(self) -> None:
        intent = parse_search_intent("Show highly rated story rich games under 25 dollars", AVAILABLE_TAGS)

        self.assertEqual(
            intent,
            {
                "max_price": 25,
                "min_rating": 4.4,
                "has_reviews": True,
                "tags": ["Story Rich"],
                "mode": "player",
            },
        )

    def test_parse_multiplayer_survival_deal_query(self) -> None:
        intent = parse_search_intent("Find cheap multiplayer survival games with good reviews", AVAILABLE_TAGS)

        self.assertEqual(intent["max_price"], 35)
        self.assertEqual(intent["min_rating"], 0)
        self.assertIs(intent["has_reviews"], True)
        self.assertEqual(intent["tags"], ["Multiplayer", "Survival"])
        self.assertEqual(intent["mode"], "player")

    def test_parse_developer_catalog_query(self) -> None:
        intent = parse_search_intent("Find premium exploration games for developer catalog analysis", AVAILABLE_TAGS)

        self.assertEqual(intent["max_price"], 70)
        self.assertIs(intent["has_reviews"], False)
        self.assertEqual(intent["tags"], ["Exploration"])
        self.assertEqual(intent["mode"], "developer")
