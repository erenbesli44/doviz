"""
Test fixtures shared across all test modules.
"""
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient

from app.cache.memory import MemoryCache
from app.config import Settings
from app.main import create_app
from app.providers.base import RawQuote
from app.providers.registry import ProviderRegistry
from app.services.quote_service import QuoteService


@pytest.fixture
def settings() -> Settings:
    return Settings(
        finnhub_api_key="test-finnhub",
        fmp_api_key="test-fmp",
        coingecko_api_key="",
        quote_timeout_seconds=5.0,
    )


@pytest.fixture
def mock_raw_quote() -> RawQuote:
    return RawQuote(
        price=34.124,
        change_pct=0.12,
        open=34.0,
        high=34.3,
        low=33.9,
        fetched_at=datetime.now(UTC),
        market_status="open",
    )


@pytest.fixture
def mock_provider(mock_raw_quote: RawQuote):
    """A mock provider that returns a fixed raw quote for any symbol."""
    provider = MagicMock()   # sync object — fetch_quote is async
    provider.provider_id = "finnhub"
    provider.fetch_quote = AsyncMock(return_value=mock_raw_quote)
    provider.fetch_history = AsyncMock(return_value=[])
    provider.is_healthy = AsyncMock(return_value=True)
    return provider


@pytest.fixture
def cache() -> MemoryCache:
    return MemoryCache()


@pytest.fixture
def quote_service(mock_provider, cache, settings) -> QuoteService:
    """QuoteService wired with a mock provider registry."""
    registry = MagicMock(spec=ProviderRegistry)  # sync mock
    registry.get.return_value = mock_provider
    return QuoteService(registry, cache, timeout=5.0)


@pytest.fixture
def client(quote_service, cache, settings) -> TestClient:
    """TestClient with mocked service dependencies injected via app.state."""
    app = create_app()

    # Pre-populate app state so DI resolvers find them
    app.state.http_client = httpx.AsyncClient()
    app.state.cache = cache

    # Override the QuoteService dependency
    from app.dependencies import get_quote_service
    app.dependency_overrides[get_quote_service] = lambda: quote_service

    return TestClient(app)
