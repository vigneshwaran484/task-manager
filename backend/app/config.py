"""
Application settings — all values come from environment variables.
No secrets are ever hardcoded. In local dev, values are loaded from .env
(via pydantic-settings). In Azure, they are injected from Key Vault
references set on the App Service / Container App configuration.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host:5432/db

    # ── JWT ───────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str          # pulled from Key Vault in prod
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15   # short-lived
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── App ───────────────────────────────────────────────────────────────
    APP_ENV: str = "development"  # development | production
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]  # Vite dev server

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    """Cached singleton — avoids re-parsing .env on every request."""
    return Settings()  # type: ignore[call-arg]
