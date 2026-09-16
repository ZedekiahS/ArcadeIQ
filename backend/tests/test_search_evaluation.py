from __future__ import annotations

from contextlib import redirect_stdout
from copy import deepcopy
import io
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import urllib.error

from app.scripts.evaluate_search import evaluate, evaluate_case, provider_error_kind, score
from app.services.ai_search import AIProviderError


class SearchEvaluationTests(unittest.TestCase):
    def setUp(self) -> None:
        # These tests must remain safe to run with a configured real provider key.
        network = patch(
            "app.services.ai_search.urllib.request.urlopen",
            side_effect=AssertionError("Evaluation unit tests must not call the network"),
        )
        self.network = network.start()
        self.addCleanup(network.stop)
        session = patch("app.scripts.evaluate_search.Session")
        self.session = session.start()
        self.addCleanup(session.stop)
        self.session.return_value.__enter__.return_value.scalars.return_value = [SimpleNamespace(id=1)]
        output = redirect_stdout(io.StringIO())
        output.__enter__()
        self.addCleanup(output.__exit__, None, None, None)
        self.settings = SimpleNamespace(
            ai_enabled=True,
            ai_provider="deepseek",
            ai_fallback_to_rules=True,
            deepseek_api_key="test-key-not-a-real-credential",
            deepseek_model="test-model",
            deepseek_base_url="https://example.invalid",
            ai_timeout_seconds=1,
        )
        self.engine = object()

    @staticmethod
    def case(query: str = "Celeste") -> dict:
        return {
            "query": query,
            "expected": {"titleQuery": query.lower() if query.strip() else None, "tags": []},
            "gameIds": [1],
        }

    def fixture(self, queries: list[str]) -> dict:
        return {
            "availableTags": ["Platformer", "Space"],
            "games": [{"name": "Celeste", "tags": ["Platformer"]}],
            "cases": [self.case(query) for query in queries],
        }

    @staticmethod
    def outcome(settings, case: dict, *, error: str | None = None) -> dict:
        attempted = settings.ai_enabled and bool(case["query"].strip())
        fallback = attempted and error is not None
        return {
            "source": "deepseek" if attempted and not fallback else "rules",
            "provider_attempted": attempted,
            "fallback": fallback,
            "error": error if attempted else None,
            "latency_ms": 1,
            "intent_pass": True,
            "results_pass": True,
            "both_pass": True,
        }

    def test_tag_order_is_ignored_but_result_order_is_strict(self) -> None:
        case = {"expected": {"tags": ["Multiplayer", "FPS"]}, "gameIds": [2, 1]}
        result = score(case, {"tags": ["FPS", "Multiplayer"]}, [1, 2])
        self.assertTrue(result["intent_pass"])
        self.assertFalse(result["results_pass"])
        self.assertFalse(result["both_pass"])
        self.assertEqual(result["mismatches"], {})

    def test_only_explicit_contract_fields_are_scored(self) -> None:
        case = {"expected": {"maxPrice": 35, "tags": ["FPS"]}, "gameIds": []}
        result = score(case, {"maxPrice": 35, "tags": ["FPS"], "hasReviews": True}, [])
        self.assertTrue(result["both_pass"])
        result = score(case, {"maxPrice": 25, "tags": ["FPS"]}, [])
        self.assertFalse(result["intent_pass"])
        self.assertTrue(result["results_pass"])
        self.assertEqual(result["mismatches"], {"maxPrice": {"expected": 35, "actual": 25}})

    def test_blank_bypasses_provider_without_mutating_settings(self) -> None:
        before = deepcopy(vars(self.settings))
        result = evaluate(self.fixture(["   "]), self.settings, self.engine, live=True, max_calls=1)
        self.network.assert_not_called()
        self.assertEqual(result["provider_calls"], 0)
        self.assertEqual(result["blank_bypasses"], 1)
        self.assertEqual(result["deepseek_integration"]["count"], 0)
        self.assertEqual(result["live_product_including_fallback"]["both_pass"], 1)
        self.assertEqual(vars(self.settings), before)

    def test_rules_only_never_calls_provider_even_if_settings_enable_ai(self) -> None:
        before = deepcopy(vars(self.settings))
        result = evaluate(self.fixture(["Celeste", "   "]), self.settings, self.engine, live=False, max_calls=2)
        self.network.assert_not_called()
        self.assertEqual(result["provider_calls"], 0)
        self.assertEqual(result["rules"]["both_pass"], 2)
        self.assertEqual(result["deepseek_integration"]["count"], 0)
        self.assertEqual(result["not_run"], 2)
        self.assertEqual(result["actual_catalog_tags"], ["Platformer"])
        self.assertTrue(all(row["deepseek"] is None for row in result["cases"]))
        self.assertEqual(vars(self.settings), before)

    def test_evaluate_case_records_failure_then_rule_recovery_without_mutation(self) -> None:
        before = deepcopy(vars(self.settings))
        error = AIProviderError("Provider failed")
        error.__cause__ = TimeoutError("simulated timeout")
        with patch("app.services.ai_search.parse_with_deepseek", side_effect=error) as provider:
            result = evaluate_case(self.case(), self.settings, self.engine, ["Platformer"], ["Celeste"])
        self.assertEqual(provider.call_count, 1)
        self.assertEqual(result["source"], "rules")
        self.assertEqual(result["error"], "timeout")
        self.assertTrue(result["provider_attempted"])
        self.assertTrue(result["fallback"])
        self.assertTrue(result["both_pass"])
        self.assertEqual(vars(self.settings), before)

    def test_successful_fallback_does_not_count_as_deepseek_success(self) -> None:
        error = AIProviderError("Provider failed")
        error.__cause__ = TimeoutError("simulated timeout")
        with patch("app.services.ai_search.parse_with_deepseek", side_effect=error):
            result = evaluate(self.fixture(["Celeste"]), self.settings, self.engine, live=True, max_calls=1)
        self.assertEqual(result["provider_calls"], 1)
        self.assertEqual(result["fallback_count"], 1)
        self.assertEqual(result["deepseek_integration"]["count"], 0)
        self.assertEqual(result["deepseek_integration"]["both_pass"], 0)
        self.assertEqual(result["live_product_including_fallback"]["both_pass"], 1)

    def test_call_budget_allows_blank_bypass_but_stops_further_paid_attempts(self) -> None:
        def run(case, settings, *args):
            return self.outcome(settings, case)

        with patch("app.scripts.evaluate_search.evaluate_case", side_effect=run) as runner:
            result = evaluate(self.fixture(["one", "two", " ", "three"]), self.settings, self.engine, live=True, max_calls=2)
        self.assertEqual(result["provider_calls"], 2)
        self.assertEqual(result["blank_bypasses"], 1)
        self.assertEqual(result["stopped_reason"], "call_limit")
        self.assertEqual(result["not_run"], 1)
        self.assertEqual(result["rules"]["count"], 4)
        self.assertEqual(runner.call_count, 7)

    def test_authentication_error_stops_live_calls_but_completes_rules(self) -> None:
        for status in (401, 403):
            with self.subTest(status=status):
                failure = AIProviderError("Provider failed")
                failure.__cause__ = urllib.error.HTTPError("https://example.invalid", status, "denied", {}, None)
                with patch("app.services.ai_search.parse_with_deepseek", side_effect=failure) as provider:
                    result = evaluate(self.fixture(["Celeste"] * 4), self.settings, self.engine, live=True, max_calls=4)
                self.assertEqual(provider.call_count, 1)
                self.assertEqual(result["provider_calls"], 1)
                self.assertEqual(result["stopped_reason"], f"http_{status}")
                self.assertEqual(result["not_run"], 3)
                self.assertEqual(result["rules"]["both_pass"], 4)

    def test_three_provider_failures_stop_even_with_blank_between_attempts(self) -> None:
        for queries, bypasses in ((["one", "two", "three", "four"], 0), (["one", " ", "two", "three", "four"], 1)):
            with self.subTest(queries=queries):
                def run(case, settings, *args):
                    return self.outcome(settings, case, error="timeout")

                with patch("app.scripts.evaluate_search.evaluate_case", side_effect=run):
                    result = evaluate(self.fixture(queries), self.settings, self.engine, live=True, max_calls=10)
                self.assertEqual(result["provider_calls"], 3)
                self.assertEqual(result["blank_bypasses"], bypasses)
                self.assertEqual(result["stopped_reason"], "three_consecutive_provider_failures")
                self.assertEqual(result["not_run"], 1)
                self.assertEqual(result["rules"]["count"], len(queries))

    def test_provider_success_resets_consecutive_failure_counter(self) -> None:
        outcomes = iter(["timeout", "timeout", None, "timeout", "timeout", "timeout"])

        def run(case, settings, *args):
            return self.outcome(settings, case, error=next(outcomes) if settings.ai_enabled else None)

        with patch("app.scripts.evaluate_search.evaluate_case", side_effect=run):
            result = evaluate(self.fixture(["query"] * 7), self.settings, self.engine, live=True, max_calls=10)
        self.assertEqual(result["provider_calls"], 6)
        self.assertEqual(result["fallback_count"], 5)
        self.assertEqual(result["deepseek_integration"]["both_pass"], 1)
        self.assertEqual(result["stopped_reason"], "three_consecutive_provider_failures")
        self.assertEqual(result["not_run"], 1)

    def test_error_categories_keep_transport_failure_distinct_from_bad_response(self) -> None:
        for cause, expected in ((TimeoutError(), "timeout"), (urllib.error.URLError("offline"), "transport_error"), (None, "invalid_response")):
            with self.subTest(expected=expected):
                error = AIProviderError("Provider failed")
                error.__cause__ = cause
                self.assertEqual(provider_error_kind(error), expected)


if __name__ == "__main__":
    unittest.main()
