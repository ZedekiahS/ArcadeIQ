from __future__ import annotations

import unittest
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import dialect

from app.api.games import apply_intent_filters
from app.db.models import Game
from app.schemas import SearchIntentOut
from app.services.search_intent import parse_search_intent


class SearchTitleTests(unittest.TestCase):
    def test_shared_search_contract_intents(self) -> None:
        fixture = json.loads((Path(__file__).resolve().parents[2] / "tests/fixtures/search-contract.json").read_text(encoding="utf-8"))
        for case in fixture["cases"]:
            with self.subTest(query=case["query"]):
                intent = parse_search_intent(case["query"], fixture["availableTags"], [game["name"] for game in fixture["games"]])
                serialized = SearchIntentOut(**intent).model_dump(by_alias=True)
                for key, expected in case["expected"].items():
                    self.assertEqual(serialized[key], expected, key)

    def test_bare_title_and_unknown_input_are_literal_title_filters(self) -> None:
        for query in ("Celeste", "DefinitelyNotARealGame", "transaction"):
            with self.subTest(query=query):
                intent = parse_search_intent(query, ["Action"])
                self.assertEqual(intent["title_query"], query.lower())
                self.assertEqual(intent["tags"], [])
                self.assertIsNone(intent["max_price"])

    def test_known_title_is_removed_before_matching_tag_or_ranking_words(self) -> None:
        for title in ("Space Haven", "First Class Trouble"):
            with self.subTest(title=title):
                intent = parse_search_intent(f"Find {title} under $25.50", ["Space"], [title])
                self.assertEqual(intent["title_query"], title.lower())
                self.assertEqual(intent["max_price"], 25.50)
                self.assertEqual(intent["tags"], [])
                self.assertEqual(intent["offset"], 0)
                self.assertIsNone(intent["limit"])

    def test_title_budget_and_tag_are_combined(self) -> None:
        intent = parse_search_intent('"Celeste" platformer under $20.99', ["Platformer"])
        self.assertEqual(intent["title_query"], "celeste")
        self.assertEqual(intent["max_price"], 20.99)
        self.assertEqual(intent["tags"], ["Platformer"])

    def test_empty_query_has_no_unrequested_budget(self) -> None:
        intent = parse_search_intent("  ", ["FPS"])
        self.assertIsNone(intent["title_query"])
        self.assertIsNone(intent["max_price"])

    def test_title_sql_escapes_like_wildcards_and_does_not_add_budget(self) -> None:
        intent = parse_search_intent('"100%_Fun"', [])
        stmt = apply_intent_filters(select(Game), intent)
        compiled = stmt.compile(dialect=dialect())
        self.assertIn("games.name ILIKE", str(compiled))
        self.assertIn("100/%/_fun", compiled.params.values())
        self.assertNotIn("games.price <=", str(compiled))


if __name__ == "__main__":
    unittest.main()
