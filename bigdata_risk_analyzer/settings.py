from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings

from bigdata_risk_analyzer import logger

PROJECT_DIRECTORY = Path(__file__).parent.parent


class Settings(BaseSettings):
    # Required
    BIGDATA_API_KEY: str
    OPENAI_API_KEY: str

    # Set access token to enable authentication on the endpoints
    ACCESS_TOKEN: str | None = None
    TEMPLATES_DIR: str = str(PROJECT_DIRECTORY / "bigdata_risk_analyzer" / "templates")

    # Static dir configuration
    STATIC_DIR: str = str(PROJECT_DIRECTORY / "bigdata_risk_analyzer" / "static")

    # Data storage configuration
    DB_STRING: str = "sqlite:///risk_analyzer.db"

    @classmethod
    def load_from_env(cls) -> "Settings":
        return cls()

    @field_validator("ACCESS_TOKEN", mode="after")
    @classmethod
    def validate_access_token(cls, v: str | None) -> str | None:
        if v is not None and len(v) == 0:
            raise ValueError("ACCESS_TOKEN cannot be an empty string")
        if v is not None and len(v) > 0:
            logger.info(
                "ACCESS_TOKEN is set, the API endpoints will be protected. Use the `token` query parameter to authenticate."
            )
        return v


settings = Settings.load_from_env()
