from pathlib import Path

from pydantic_settings import BaseSettings

PROJECT_DIRECTORY = Path(__file__).parent.parent


class Settings(BaseSettings):
    # Required
    BIGDATA_API_KEY: str
    OPENAI_API_KEY: str

    TEMPLATES_DIR: str = str(PROJECT_DIRECTORY / "bigdata_risk_analyzer" / "templates")

    @classmethod
    def load_from_env(cls) -> "Settings":
        return cls()


settings = Settings.load_from_env()
