import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "GDL_DATABASE_URL",
            "postgresql+psycopg://gdl:gdl_dev_password@localhost:5432/gdl",
        )
        self.cors_origins = [
            origin.strip()
            for origin in os.getenv("GDL_CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ]
        self.ai_enabled = env_bool("GDL_AI_ENABLED", default=False)
        self.ai_provider = os.getenv("GDL_AI_PROVIDER", "rules").strip().lower()
        self.ai_fallback_to_rules = env_bool("GDL_AI_FALLBACK_TO_RULES", default=True)
        self.ai_timeout_seconds = float(os.getenv("GDL_AI_TIMEOUT_SECONDS", "8"))
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-flash")
        self.admin_user_id = os.getenv("GDL_ADMIN_USER_ID", "local-admin").strip()
        self.admin_email = os.getenv("GDL_ADMIN_EMAIL", "admin@game-discovery-lens.local").strip()
        self.admin_display_name = os.getenv("GDL_ADMIN_DISPLAY_NAME", "Local Admin").strip()
        self.admin_password = os.getenv("GDL_ADMIN_PASSWORD", "change-this-local-admin-password")
        self.auth_secret = os.getenv("GDL_AUTH_SECRET", "local-only-change-this-auth-secret")
        self.auth_token_ttl_seconds = int(os.getenv("GDL_AUTH_TOKEN_TTL_SECONDS", "43200"))


def env_bool(name: str, *, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
