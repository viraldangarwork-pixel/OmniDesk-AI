from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "OmniDesk AI"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = (
        "postgresql+asyncpg://omnidesk:omnidesk@postgres:5432/omnidesk"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql+psycopg2://omnidesk:omnidesk@postgres:5432/omnidesk"
    )

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-4-7"
    OPENAI_API_KEY: str = ""

    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    UPLOAD_DIR: str = "/app/uploads"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@omnidesk.ai"

    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_VERIFY_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_TOKEN: str = ""
    TELEGRAM_BOT_TOKEN: str = ""

    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost",
            "http://localhost:5173",
            "http://localhost:3000",
        ]
    )

    RATE_LIMIT_PER_MIN: int = 120


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
