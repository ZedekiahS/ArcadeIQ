from __future__ import annotations

from sqlalchemy import Float, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    release_year: Mapped[int] = mapped_column(Integer, nullable=False)
    developer: Mapped[str] = mapped_column(String(120), nullable=False)
    publisher: Mapped[str] = mapped_column(String(120), nullable=False)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ownership: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
