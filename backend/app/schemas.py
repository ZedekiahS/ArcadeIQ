from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    price: float
    rating: float
    review_count: int = Field(alias="reviewCount")
    release_year: int = Field(alias="releaseYear")
    developer: str
    publisher: str
    tags: list[str]
    summary: str
    revenue: int
    ownership: int
