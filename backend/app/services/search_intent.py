from __future__ import annotations

import re
from typing import Literal, TypedDict

SearchSortBy = Literal["name", "price", "rating", "review_count", "release_year", "revenue", "ownership"]
SearchSortDirection = Literal["asc", "desc"]

TAG_ALIASES: dict[str, list[str]] = {
    "Action": ["动作"],
    "Adventure": ["冒险"],
    "Atmospheric": ["氛围", "沉浸"],
    "Card Battler": ["卡牌"],
    "Co-op": ["合作", "协作"],
    "Crafting": ["制作", "建造"],
    "Exploration": ["探索"],
    "FPS": ["第一人称射击"],
    "Management": ["管理"],
    "Multiplayer": ["多人", "联机"],
    "Open World": ["开放世界"],
    "Puzzle": ["解谜", "谜题"],
    "RPG": ["角色扮演"],
    "Roguelike": ["肉鸽"],
    "Shooter": ["射击", "枪战"],
    "Simulation": ["模拟"],
    "Singleplayer": ["单人"],
    "Space": ["太空"],
    "Story Rich": ["剧情", "故事"],
    "Strategy": ["策略"],
    "Survival": ["生存"],
    "Survival Horror": ["恐怖", "生存恐怖"],
}


class SearchIntent(TypedDict):
    max_price: float
    min_rating: float
    has_reviews: bool
    tags: list[str]
    mode: Literal["player", "developer"]
    sort_by: SearchSortBy | None
    sort_direction: SearchSortDirection
    limit: int | None
    offset: int


def default_search_intent() -> SearchIntent:
    return {
        "max_price": 70,
        "min_rating": 0,
        "has_reviews": False,
        "tags": [],
        "mode": "player",
        "sort_by": None,
        "sort_direction": "asc",
        "limit": None,
        "offset": 0,
    }


def parse_search_intent(query: str, available_tags: list[str]) -> SearchIntent:
    text = query.lower()
    intent = default_search_intent()

    explicit_price = re.search(r"(?:under|below|less than)\s+\$?(\d+)", text)
    if explicit_price:
        intent["max_price"] = int(explicit_price.group(1))
    elif is_budget_price_query(text):
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

    apply_ranking_intent(text, intent)

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

    add_alias_tags(text, matched_tags, available_tags)

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

    sort_by = normalize_sort_by(get_first(raw_intent, "sortBy", "sort_by"))
    if sort_by is not None:
        intent["sort_by"] = sort_by

    raw_sort_direction = str(get_first(raw_intent, "sortDirection", "sort_direction") or "").strip().lower()
    if raw_sort_direction in {"desc", "descending"}:
        intent["sort_direction"] = "desc"
    elif raw_sort_direction in {"asc", "ascending"}:
        intent["sort_direction"] = "asc"

    intent["limit"] = clamp_integer(get_first(raw_intent, "limit"), default=None, minimum=1, maximum=50)
    intent["offset"] = clamp_integer(get_first(raw_intent, "offset"), default=0, minimum=0, maximum=100) or 0

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


def apply_ranking_intent(text: str, intent: SearchIntent) -> None:
    if has_any(text, ["most expensive", "highest price", "priciest"]) or "最贵" in text or re.search(r"第[一二三四五]\s*贵", text):
        intent["sort_by"] = "price"
        intent["sort_direction"] = "desc"
        if should_limit_superlative(text):
            intent["limit"] = 1
    elif has_any(text, ["cheapest", "lowest price", "least expensive"]) or "最便宜" in text:
        intent["sort_by"] = "price"
        intent["sort_direction"] = "asc"
        if should_limit_superlative(text):
            intent["limit"] = 1
    elif has_any(text, ["cheap", "deal"]) or "便宜" in text:
        intent["sort_by"] = "price"
        intent["sort_direction"] = "asc"
    elif has_any(text, ["highest rated", "top rated", "best rated", "highly rated"]) or re.search(r"\bbest\b", text):
        intent["sort_by"] = "rating"
        intent["sort_direction"] = "desc"
    elif has_any(text, ["most reviewed", "review volume", "most reviews"]):
        intent["sort_by"] = "review_count"
        intent["sort_direction"] = "desc"
    elif has_any(text, ["newest", "latest", "most recent"]):
        intent["sort_by"] = "release_year"
        intent["sort_direction"] = "desc"
    elif "oldest" in text:
        intent["sort_by"] = "release_year"
        intent["sort_direction"] = "asc"
    elif has_any(text, ["highest revenue", "most revenue", "top revenue"]):
        intent["sort_by"] = "revenue"
        intent["sort_direction"] = "desc"
    elif has_any(text, ["most owned", "highest ownership"]):
        intent["sort_by"] = "ownership"
        intent["sort_direction"] = "desc"

    limit = parse_requested_limit(text)
    if limit is not None:
        intent["limit"] = limit
        if intent["sort_by"] is None:
            intent["sort_by"] = "rating"
            intent["sort_direction"] = "desc"

    ordinal_rank = parse_ordinal_rank(text)
    if ordinal_rank is not None:
        intent["offset"] = ordinal_rank - 1
        intent["limit"] = 1


def is_budget_price_query(text: str) -> bool:
    if has_any(text, ["cheapest", "lowest price", "least expensive"]) or "最便宜" in text:
        return False
    return has_any(text, ["cheap", "deal"]) or "便宜" in text


def should_limit_superlative(text: str) -> bool:
    if parse_requested_limit(text) is not None:
        return False
    if re.search(r"\b(?:all|list)\b", text):
        return False
    if re.search(r"\bgames\b", text) and not re.search(r"\bgame\b", text):
        return False
    return True


def parse_requested_limit(text: str) -> int | None:
    patterns = [
        r"\btop\s+(\d{1,2})\b",
        r"\b(?:show|find|give me|list)\s+(?:the\s+)?(\d{1,2})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return max(1, min(int(match.group(1)), 50))
    return None


def parse_ordinal_rank(text: str) -> int | None:
    ordinal_words = {
        "first": 1,
        "1st": 1,
        "second": 2,
        "2nd": 2,
        "third": 3,
        "3rd": 3,
        "fourth": 4,
        "4th": 4,
        "fifth": 5,
        "5th": 5,
    }
    chinese_ordinals = {
        "第一": 1,
        "第二": 2,
        "第三": 3,
        "第四": 4,
        "第五": 5,
    }
    for token, rank in chinese_ordinals.items():
        if token in text:
            return rank
    for token, rank in ordinal_words.items():
        if re.search(rf"\b{re.escape(token)}\b", text):
            return rank
    return None


def has_any(text: str, phrases: list[str]) -> bool:
    return any(phrase in text for phrase in phrases)


def add_alias_tags(text: str, matched_tags: set[str], available_tags: list[str]) -> None:
    available_tag_lookup = {tag.lower(): tag for tag in available_tags}
    for canonical_tag, aliases in TAG_ALIASES.items():
        tag = available_tag_lookup.get(canonical_tag.lower())
        if tag and any(alias in text for alias in aliases):
            matched_tags.add(tag)


def normalize_sort_by(value: object | None) -> SearchSortBy | None:
    if value is None:
        return None
    normalized = str(value).strip().lower().replace("-", "_")
    aliases: dict[str, SearchSortBy] = {
        "name": "name",
        "price": "price",
        "rating": "rating",
        "review_count": "review_count",
        "reviewcount": "review_count",
        "reviews": "review_count",
        "release_year": "release_year",
        "releaseyear": "release_year",
        "year": "release_year",
        "revenue": "revenue",
        "ownership": "ownership",
        "owners": "ownership",
    }
    return aliases.get(normalized)


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


def clamp_integer(value: object | None, *, default: int | None, minimum: int, maximum: int) -> int | None:
    if value is None or value == "":
        return default
    try:
        number = int(float(value))
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
