from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Game

SEED_GAMES = [
    {
        "id": 1,
        "name": "Smalland: Survive the Wilds",
        "price": 34.99,
        "rating": 4.2,
        "review_count": 128,
        "release_year": 2024,
        "developer": "Merge Games",
        "publisher": "Maximum Entertainment",
        "tags": ["Survival", "Multiplayer", "Open World", "Crafting"],
        "summary": "A survival crafting title with strong multiplayer fit and clear collection mechanics.",
        "revenue": 41820,
        "ownership": 1360,
    },
    {
        "id": 2,
        "name": "Celeste",
        "price": 19.99,
        "rating": 4.8,
        "review_count": 312,
        "release_year": 2018,
        "developer": "Maddy Makes Games",
        "publisher": "Extremely OK Games",
        "tags": ["Platformer", "Difficult", "Story Rich", "Singleplayer"],
        "summary": "A precision platformer with exceptional review quality and lasting catalog value.",
        "revenue": 62300,
        "ownership": 4260,
    },
    {
        "id": 3,
        "name": "SIGNALIS",
        "price": 19.99,
        "rating": 4.6,
        "review_count": 204,
        "release_year": 2022,
        "developer": "rose-engine",
        "publisher": "Humble Games",
        "tags": ["Survival Horror", "Atmospheric", "Story Rich", "Singleplayer"],
        "summary": "A high-sentiment horror game with strong narrative identity and review consistency.",
        "revenue": 36400,
        "ownership": 2170,
    },
    {
        "id": 4,
        "name": "Riven",
        "price": 34.99,
        "rating": 4.3,
        "review_count": 84,
        "release_year": 2024,
        "developer": "Cyan Worlds",
        "publisher": "Cyan Worlds",
        "tags": ["Puzzle", "Adventure", "Exploration", "Singleplayer"],
        "summary": "A premium puzzle adventure with clear niche appeal and strong discovery potential.",
        "revenue": 29820,
        "ownership": 920,
    },
    {
        "id": 5,
        "name": "Aimlabs",
        "price": 0,
        "rating": 4.1,
        "review_count": 455,
        "release_year": 2023,
        "developer": "State Space Labs",
        "publisher": "State Space Labs",
        "tags": ["FPS", "Shooter", "Multiplayer", "Training"],
        "summary": "A free-to-play aim trainer with broad acquisition value and competitive positioning.",
        "revenue": 12400,
        "ownership": 15400,
    },
    {
        "id": 6,
        "name": "Mind Over Magic",
        "price": 24.99,
        "rating": 4.0,
        "review_count": 76,
        "release_year": 2025,
        "developer": "Sparkypants",
        "publisher": "Klei Publishing",
        "tags": ["Survival", "Management", "Strategy", "Crafting"],
        "summary": "A management sim with survival hooks and a clear strategy audience.",
        "revenue": 16840,
        "ownership": 780,
    },
    {
        "id": 7,
        "name": "EVERSPACE 2",
        "price": 49.99,
        "rating": 4.4,
        "review_count": 143,
        "release_year": 2023,
        "developer": "ROCKFISH Games",
        "publisher": "ROCKFISH Games",
        "tags": ["Shooter", "Space", "RPG", "Exploration"],
        "summary": "A premium space RPG with strong genre alignment and high-value positioning.",
        "revenue": 71200,
        "ownership": 1530,
    },
    {
        "id": 8,
        "name": "ANIMAL WELL",
        "price": 24.99,
        "rating": 4.7,
        "review_count": 229,
        "release_year": 2024,
        "developer": "Billy Basso",
        "publisher": "Bigmode",
        "tags": ["Metroidvania", "Puzzle", "Exploration", "Atmospheric"],
        "summary": "A compact exploration game with unusually strong sentiment and discovery momentum.",
        "revenue": 58200,
        "ownership": 2710,
    },
]


def seed_games(db: Session) -> None:
    for game_data in SEED_GAMES:
        game = db.get(Game, game_data["id"])
        if game is None:
            db.add(Game(**game_data))
        else:
            for key, value in game_data.items():
                setattr(game, key, value)
    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed_games(db)
        print(f"Seeded {len(SEED_GAMES)} games.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
