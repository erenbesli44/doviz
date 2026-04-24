from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    api_secret_key: str = ""

    @model_validator(mode="after")
    def require_secret_key(self) -> "Settings":
        if not self.api_secret_key:
            raise ValueError("API_SECRET_KEY must be set — refusing to start without authentication")
        return self

    finnhub_api_key: str = ""
    fmp_api_key: str = ""
    coingecko_api_key: str = ""  # empty = unauthenticated free tier

    quote_timeout_seconds: float = 5.0
    http_verify_tls: bool = True
    http_ca_bundle: str = ""
    debug: bool = False
    log_level: str = "INFO"
    cors_allow_origins: str = "*"

    # YouTube summary tracker — proxied through /v1/news/* so the key
    # stays server-side.
    tracker_api_url: str = "http://t122yraee5v724x7tonr3d6g.204.168.192.245.sslip.io"
    tracker_api_key: str = ""
    tracker_timeout_seconds: float = 10.0
