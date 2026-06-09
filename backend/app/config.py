import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "ARCADEIQ_DATABASE_URL",
            "postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq",
        )
        self.cors_origins = [
            origin.strip()
            for origin in os.getenv("ARCADEIQ_CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
