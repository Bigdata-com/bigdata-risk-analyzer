from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings

from bigdata_risk_analyzer import logger

PROJECT_DIRECTORY = Path(__file__).parent.parent

UNSET: Literal["<UNSET>"] = "<UNSET>"

class Settings(BaseSettings):
    # Demo mode - disables "Run Analysis" functionality, only allows pre-computed demos
    # Only affects the frontend, to protect the backend, set ACCESS_TOKEN
    DEMO_MODE: bool = False

    # Required, except on demo mode
    BIGDATA_API_KEY: str | Literal["<UNSET>"] = UNSET
    OPENAI_API_KEY: str | Literal["<UNSET>"] = UNSET

    # Set access token to enable authentication on the endpoints
    ACCESS_TOKEN: str | None = None

    TEMPLATES_DIR: str = str(PROJECT_DIRECTORY / "bigdata_risk_analyzer" / "templates")

    # Static dir configuration
    STATIC_DIR: str = str(PROJECT_DIRECTORY / "bigdata_risk_analyzer" / "static")

    # Data storage configuration
    DB_STRING: str = "sqlite:///risk_analyzer.db"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

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

    @model_validator(mode="after")
    def validate_demo_mode(self) -> "Settings":
        if self.DEMO_MODE:
            logger.warning(
                "DEMO_MODE is enabled. Running new analyses is disabled. "
                "This mode is intended for demonstration purposes only."
            )
        else:
            if self.BIGDATA_API_KEY == UNSET or self.OPENAI_API_KEY == UNSET:
                raise ValueError(
                    "BIGDATA_API_KEY and OPENAI_API_KEY must be set when DEMO_MODE is disabled."
                )
        return self

settings = Settings.load_from_env()
