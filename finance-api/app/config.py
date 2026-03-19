from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    finnhub_api_key: str = ""
    fmp_api_key: str = ""
    coingecko_api_key: str = ""  # empty = unauthenticated free tier

    quote_timeout_seconds: float = 5.0
    debug: bool = False
    log_level: str = "INFO"
