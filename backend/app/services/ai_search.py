from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass

from app.config import Settings
from app.services.search_intent import SearchIntent, normalize_search_intent, parse_search_intent


class AIProviderError(RuntimeError):
    pass


@dataclass(frozen=True)
class IntentParseResult:
    intent: SearchIntent
    source: str


def resolve_search_intent(query: str, available_tags: list[str], settings: Settings) -> IntentParseResult:
    if not settings.ai_enabled or settings.ai_provider == "rules":
        return parse_with_rules(query, available_tags)

    try:
        if settings.ai_provider == "deepseek":
            return IntentParseResult(
                intent=parse_with_deepseek(query, available_tags, settings),
                source="deepseek",
            )
        raise AIProviderError(f"Unsupported AI provider: {settings.ai_provider}")
    except AIProviderError:
        if settings.ai_fallback_to_rules:
            return parse_with_rules(query, available_tags)
        raise


def parse_with_rules(query: str, available_tags: list[str]) -> IntentParseResult:
    return IntentParseResult(intent=parse_search_intent(query, available_tags), source="rules")


def parse_with_deepseek(query: str, available_tags: list[str], settings: Settings) -> SearchIntent:
    if not settings.deepseek_api_key:
        raise AIProviderError("DeepSeek API key is not configured.")

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {
                "role": "system",
                "content": build_intent_system_prompt(available_tags),
            },
            {
                "role": "user",
                "content": query,
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0,
    }
    request = urllib.request.Request(
        url=f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.deepseek_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.ai_timeout_seconds) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
        raise AIProviderError("DeepSeek request failed.") from exc

    try:
        content = body["choices"][0]["message"]["content"]
        raw_intent = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise AIProviderError("DeepSeek returned an invalid intent payload.") from exc

    if not isinstance(raw_intent, dict):
        raise AIProviderError("DeepSeek intent payload was not a JSON object.")

    return normalize_search_intent(raw_intent, available_tags)


def build_intent_system_prompt(available_tags: list[str]) -> str:
    tags = ", ".join(available_tags)
    return (
        "You are ArcadeIQ's game search intent parser. Return json only. "
        "Use exactly this JSON shape: "
        '{"maxPrice": number, "minRating": number, "hasReviews": boolean, "tags": string[], '
        '"mode": "player" | "developer", "sortBy": null | "name" | "price" | "rating" | "review_count" | '
        '"release_year" | "revenue" | "ownership", "sortDirection": "asc" | "desc", "limit": null | number, "offset": number}. '
        "Use only these tags when tags are relevant: "
        f"{tags}. "
        "Use player mode for player discovery queries and developer mode for catalog, revenue, or market analysis queries. "
        "For ranked queries such as second most expensive, use sortBy price, sortDirection desc, limit 1, and offset 1. "
        "If the query does not imply a filter, use maxPrice 70, minRating 0, hasReviews false, an empty tags array, sortBy null, sortDirection asc, limit null, and offset 0."
    )
