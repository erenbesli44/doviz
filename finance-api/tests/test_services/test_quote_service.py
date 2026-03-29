"""
Unit tests for QuoteService — fallback logic, cache behaviour, normalization.
All external providers are mocked.
"""
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cache.memory import MemoryCache
from app.providers.base import ProviderError, RawQuote
from app.services.quote_service import QuoteService


@pytest.fixture
def raw_quote():
    return RawQuote(price=34.5, change_pct=0.1, fetched_at=datetime.now(UTC))


@pytest.fixture
def make_service(raw_quote):
    """Factory to build QuoteService with configurable primary/fallback mocks."""
    def _make(primary_raises=None, fallback_raises=None):
        primary = MagicMock()
        primary.provider_id = "fmp"
        primary.fetch_quote = AsyncMock(
            side_effect=primary_raises,
            return_value=raw_quote,
        )

        fallback = MagicMock()
        fallback.provider_id = "yahoo"
        fallback.fetch_quote = AsyncMock(
            side_effect=fallback_raises,
            return_value=raw_quote,
        )

        registry = MagicMock()  # sync mock — registry.get() is not a coroutine

        def _get(provider_id):
            if provider_id == "fmp":
                return primary
            return fallback  # covers "yahoo" and anything else

        registry.get.side_effect = _get
        cache = MemoryCache()
        return QuoteService(registry, cache, timeout=5.0)

    return _make


@pytest.mark.asyncio
async def test_get_quote_success(make_service):
    service = make_service()
    result = await service.get_quote("USD/TRY")
    assert result.data.symbol == "USD/TRY"
    assert result.meta.provider == "fmp"
    assert result.meta.is_live is True


@pytest.mark.asyncio
async def test_get_quote_uses_cache_on_second_call(make_service):
    service = make_service()
    first = await service.get_quote("USD/TRY")
    second = await service.get_quote("USD/TRY")
    # fetched_at must be identical — second call hit cache
    assert first.meta.fetched_at == second.meta.fetched_at


@pytest.mark.asyncio
async def test_get_quote_falls_back_on_primary_failure(make_service):
    # EUR/USD has fmp primary + yahoo fallback — use it to test fallback logic
    service = make_service(
        primary_raises=ProviderError("fmp", "EURUSD", "timeout"),
    )
    result = await service.get_quote("EUR/USD")
    # Should succeed via fallback, marked as not live
    assert result.meta.provider == "yahoo"
    assert result.meta.is_live is False


@pytest.mark.asyncio
async def test_get_quote_raises_503_when_all_fail(make_service):
    from fastapi import HTTPException
    # EUR/USD has fmp primary + yahoo fallback — both fail → 503
    service = make_service(
        primary_raises=ProviderError("fmp", "EURUSD", "down"),
        fallback_raises=ProviderError("yahoo", "EURUSD=X", "down"),
    )
    with pytest.raises(HTTPException) as exc_info:
        await service.get_quote("EUR/USD")
    assert exc_info.value.status_code == 503


@pytest.mark.asyncio
async def test_get_quote_unknown_symbol_raises_404(make_service):
    from fastapi import HTTPException
    service = make_service()
    with pytest.raises(HTTPException) as exc_info:
        await service.get_quote("UNKNOWN/SYM")
    assert exc_info.value.status_code == 404
