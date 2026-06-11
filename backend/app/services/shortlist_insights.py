from __future__ import annotations

from collections import Counter
from typing import Protocol, TypedDict


class ShortlistGame(Protocol):
    name: str
    price: float
    rating: float
    tags: list[str]
    revenue: int


class SavedGameLike(Protocol):
    game: ShortlistGame


class InsightPanel(TypedDict):
    title: str
    caption: str
    body: str
    bullets: list[str]


class ShortlistInsights(TypedDict):
    user_id: str
    saved_count: int
    average_price: float
    average_rating: float
    total_visible_revenue: int
    top_tags: list[str]
    strategy: InsightPanel
    source: str


def build_shortlist_insights(saved_games: list[SavedGameLike], user_id: str) -> ShortlistInsights:
    games = [saved_game.game for saved_game in saved_games]
    saved_count = len(games)

    if saved_count == 0:
        return {
            "user_id": user_id,
            "saved_count": 0,
            "average_price": 0,
            "average_rating": 0,
            "total_visible_revenue": 0,
            "top_tags": [],
            "strategy": {
                "title": "Collection Intelligence",
                "caption": "Rules preview",
                "body": "Save games to this collection to compare pricing, sentiment, and genre concentration.",
                "bullets": [
                    "Start with two or three games from different tags.",
                    "Use collections to separate player wishlists from developer research.",
                    "Future AI summaries can use this endpoint as their context source.",
                ],
            },
            "source": "rules",
        }

    average_price = sum(game.price for game in games) / saved_count
    average_rating = sum(game.rating for game in games) / saved_count
    total_visible_revenue = sum(game.revenue for game in games)
    top_tags = [tag for tag, _ in Counter(tag for game in games for tag in game.tags).most_common(4)]
    strongest_game = max(games, key=lambda game: game.rating)
    price_position = "accessible" if average_price <= 25 else "premium"
    tag_phrase = ", ".join(top_tags[:3]) if top_tags else "mixed genres"

    return {
        "user_id": user_id,
        "saved_count": saved_count,
        "average_price": round(average_price, 2),
        "average_rating": round(average_rating, 2),
        "total_visible_revenue": total_visible_revenue,
        "top_tags": top_tags,
        "strategy": {
            "title": "Collection Intelligence",
            "caption": "Rules preview",
            "body": (
                f"This collection leans {price_position} with {tag_phrase} demand. "
                f"{strongest_game.name} is the strongest sentiment anchor at {strongest_game.rating:.1f} rating."
            ),
            "bullets": [
                f"Saved games: {saved_count}.",
                f"Average price: {format_money(average_price)}.",
                f"Visible revenue represented: ${format_compact(total_visible_revenue)}.",
                f"Top tags: {tag_phrase}.",
            ],
        },
        "source": "rules",
    }


def format_money(value: float) -> str:
    return "Free" if value == 0 else f"${value:.2f}"


def format_compact(value: int) -> str:
    if abs(value) >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if abs(value) >= 1_000:
        return f"{value / 1_000:.1f}K"
    return str(value)
