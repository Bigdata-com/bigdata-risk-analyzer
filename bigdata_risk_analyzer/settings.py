from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required
    BIGDATA_API_KEY: str
    OPENAI_API_KEY: str

    @classmethod
    def load_from_env(cls) -> "Settings":
        return cls()


settings = Settings.load_from_env()
