from __future__ import annotations

import unittest

from app.scripts.seed import SEED_GAMES


class SeedCatalogTests(unittest.TestCase):
    def test_seed_catalog_has_demo_depth(self) -> None:
        self.assertGreaterEqual(len(SEED_GAMES), 24)

    def test_seed_catalog_ids_and_names_are_unique(self) -> None:
        ids = [game["id"] for game in SEED_GAMES]
        names = [game["name"] for game in SEED_GAMES]

        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(names), len(set(names)))

    def test_seed_catalog_entries_have_searchable_tags(self) -> None:
        for game in SEED_GAMES:
            with self.subTest(game=game["name"]):
                self.assertGreaterEqual(len(game["tags"]), 3)
                self.assertGreater(game["review_count"], 0)
                self.assertGreaterEqual(game["rating"], 0)
                self.assertLessEqual(game["rating"], 5)
