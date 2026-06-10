from __future__ import annotations

import re
from typing import Literal, TypedDict


class SearchIntent(TypedDict):
    max_price: float
    min_rating: float
    has_reviews: bool
    tags: list[str]
    mode: Literal["player", "developer"]


def default_search_intent() -> SearchIntent:
    return {
        "max_price": 70,
        "min_rating": 0,
        "has_reviews": False,
        "tags": [],
        "mode": "player",
    }


def parse_search_intent(query: str, available_tags: list[str]) -> SearchIntent:
    text = query.lower()
    intent = default_search_intent()

    explicit_price = re.search(r"(?:under|below|less than)\s+\$?(\d+)", text)
    if explicit_price:
        intent["max_price"] = int(explicit_price.group(1))
    elif "cheap" in text or "deal" in text:
        intent["max_price"] = 35

    if "highly rated" in text or "top rated" in text:
        intent["min_rating"] = 4.4
        intent["has_reviews"] = True
    elif "good reviews" in text:
        intent["has_reviews"] = True
    elif "review" in text or "rated" in text:
        intent["has_reviews"] = True

    if "developer" in text or "catalog" in text or "revenue" in text:
        intent["mode"] = "developer"

    matched_tags: set[str] = set()
    for tag in available_tags:
        normalized = tag.lower()
        single_word = " " not in normalized
        if normalized in text or (single_word and normalized.split(" ")[0] in text):
            matched_tags.add(tag)

    if "story" in text:
        matched_tags.add("Story Rich")
    if "horror" in text:
        matched_tags.add("Survival Horror")
    if "multiplayer" in text:
        matched_tags.add("Multiplayer")

    intent["tags"] = prioritize_tags(sorted(matched_tags), text)
    return intent


def normalize_search_intent(raw_intent: dict[str, object], available_tags: list[str]) -> SearchIntent:
    intent = default_search_intent()
    available_tag_lookup = {tag.lower(): tag for tag in available_tags}

    intent["max_price"] = clamp_number(get_first(raw_intent, "maxPrice", "max_price"), default=70, minimum=0, maximum=500)
    intent["min_rating"] = clamp_number(get_first(raw_intent, "minRating", "min_rating"), default=0, minimum=0, maximum=5)
    intent["has_reviews"] = coerce_bool(get_first(raw_intent, "hasReviews", "has_reviews"), default=False)

    raw_mode = str(raw_intent.get("mode", "player")).lower()
    intent["mode"] = "developer" if raw_mode == "developer" else "player"

    raw_tags = raw_intent.get("tags", [])
    if isinstance(raw_tags, list):
        tags: list[str] = []
        for raw_tag in raw_tags:
            normalized_tag = str(raw_tag).strip().lower()
            tag = available_tag_lookup.get(normalized_tag)
            if tag and tag not in tags:
                tags.append(tag)
        intent["tags"] = tags[:3]

    return intent


def prioritize_tags(tags: list[str], text: str) -> list[str]:
    priority: list[str] = []

    def push(tag: str) -> None:
        if tag in tags and tag not in priority:
            priority.append(tag)

    if "multiplayer" in text:
        push("Multiplayer")
    if "survival" in text:
        push("Survival")
    if "story" in text:
        push("Story Rich")
    if "exploration" in text:
        push("Exploration")
    if "puzzle" in text:
        push("Puzzle")

    for tag in tags:
        push(tag)

    return priority[:3]


def get_first(values: dict[str, object], *keys: str) -> object | None:
    for key in keys:
        if key in values:
            return values[key]
    return None


def clamp_number(value: object | None, *, default: float, minimum: float, maximum: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default

    return min(max(number, minimum), maximum)


def coerce_bool(value: object | None, *, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes"}:
            return True
        if normalized in {"false", "0", "no"}:
            return False
    return default
