from __future__ import annotations

import unittest

from app.services.search_intent import normalize_search_intent, parse_search_intent

AVAILABLE_TAGS = [
    "Adventure",
    "Exploration",
    "FPS",
    "Metroidvania",
    "Multiplayer",
    "Puzzle",
    "Story Rich",
    "Survival",
    "Survival Horror",
]


class SearchIntentTests(unittest.TestCase):
    def test_chinese_presets_match_english_semantics(self) -> None:
        pairs = [
            ("找第二贵的FPS游戏", "Find the second most expensive FPS game"),
            ("找便宜且有评价的多人生存游戏", "Find cheap multiplayer survival games with good reviews"),
            ("找25美元以下的高评分剧情游戏", "Show highly rated story rich games under 25 dollars"),
            ("为开发者分析探索类游戏", "Find exploration games for developer catalog analysis"),
        ]
        for chinese, english in pairs:
            with self.subTest(query=chinese):
                self.assertEqual(parse_search_intent(chinese, AVAILABLE_TAGS), parse_search_intent(english, AVAILABLE_TAGS))

    def test_parse_story_rich_budget_query(self) -> None:
        intent = parse_search_intent("Show highly rated story rich games under 25 dollars", AVAILABLE_TAGS)

        self.assertEqual(
            intent,
            {
                "title_query": None,
                "max_price": 25,
                "min_rating": 4.4,
                "has_reviews": True,
                "tags": ["Story Rich"],
                "mode": "player",
                "sort_by": "rating",
                "sort_direction": "desc",
                "limit": None,
                "offset": 0,
            },
        )

    def test_parse_multiplayer_survival_deal_query(self) -> None:
        intent = parse_search_intent("Find cheap multiplayer survival games with good reviews", AVAILABLE_TAGS)

        self.assertEqual(intent["max_price"], 35)
        self.assertEqual(intent["min_rating"], 0)
        self.assertIs(intent["has_reviews"], True)
        self.assertEqual(intent["tags"], ["Multiplayer", "Survival"])
        self.assertEqual(intent["mode"], "player")
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "asc")
        self.assertIsNone(intent["limit"])
        self.assertEqual(intent["offset"], 0)

    def test_parse_developer_catalog_query(self) -> None:
        intent = parse_search_intent("Find premium exploration games for developer catalog analysis", AVAILABLE_TAGS)

        self.assertIsNone(intent["max_price"])
        self.assertIs(intent["has_reviews"], False)
        self.assertEqual(intent["tags"], ["Exploration"])
        self.assertEqual(intent["mode"], "developer")
        self.assertIsNone(intent["sort_by"])
        self.assertEqual(intent["sort_direction"], "asc")
        self.assertIsNone(intent["limit"])
        self.assertEqual(intent["offset"], 0)

    def test_parse_second_most_expensive_fps_query(self) -> None:
        intent = parse_search_intent("Find the second most expensive FPS game", AVAILABLE_TAGS)

        self.assertIsNone(intent["max_price"])
        self.assertEqual(intent["tags"], ["FPS"])
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "desc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 1)

    def test_parse_most_expensive_game_defaults_to_one_result(self) -> None:
        intent = parse_search_intent("Find the most expensive game", AVAILABLE_TAGS)

        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "desc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 0)

    def test_parse_cheapest_game_defaults_to_one_result(self) -> None:
        intent = parse_search_intent("Find the cheapest game", AVAILABLE_TAGS)

        self.assertIsNone(intent["max_price"])
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "asc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 0)

    def test_parse_plural_most_expensive_games_keeps_list(self) -> None:
        intent = parse_search_intent("Find the most expensive FPS games", AVAILABLE_TAGS)

        self.assertEqual(intent["tags"], ["FPS"])
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "desc")
        self.assertIsNone(intent["limit"])
        self.assertEqual(intent["offset"], 0)

    def test_parse_chinese_second_expensive_fps_query(self) -> None:
        intent = parse_search_intent("第二贵的FPSgame", AVAILABLE_TAGS)

        self.assertEqual(intent["tags"], ["FPS"])
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "desc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 1)

    def test_parse_chinese_mixed_superlative_and_tag_aliases(self) -> None:
        intent = parse_search_intent("找最便宜的多人 生存 game", AVAILABLE_TAGS)

        self.assertEqual(intent["tags"], ["Multiplayer", "Survival"])
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "asc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 0)

    def test_normalize_intent_filters_unknown_tags(self) -> None:
        intent = normalize_search_intent(
            {
                "maxPrice": "25",
                "minRating": "4.5",
                "hasReviews": "true",
                "tags": ["Story Rich", "Unknown Tag"],
                "mode": "developer",
                "sortBy": "price",
                "sortDirection": "desc",
                "limit": "1",
                "offset": "1",
            },
            AVAILABLE_TAGS,
        )

        self.assertEqual(intent["max_price"], 25)
        self.assertEqual(intent["min_rating"], 4.5)
        self.assertIs(intent["has_reviews"], True)
        self.assertEqual(intent["tags"], ["Story Rich"])
        self.assertEqual(intent["mode"], "developer")
        self.assertEqual(intent["sort_by"], "price")
        self.assertEqual(intent["sort_direction"], "desc")
        self.assertEqual(intent["limit"], 1)
        self.assertEqual(intent["offset"], 1)
