import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    APP_PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./booktrack.db"

    GOOGLE_BOOKS_API_KEY: str | None = None
    OPEN_LIBRARY_BASE_URL: str = "https://openlibrary.org"

    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    GOOGLE_OAUTH_CLIENT_ID: str | None = None
    JWT_SECRET: str = secrets.token_urlsafe(32)
    JWT_EXPIRES_DAYS: int = 30
    JWT_ALGORITHM: str = "HS256"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
