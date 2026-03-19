"""
Provider-level tests for FinnhubProvider using pytest-httpx to mock HTTP.
Tests that the adapter correctly parses responses and raises ProviderError on failures.
"""
import re

import pytest
from pytest_httpx import HTTPXMock

from app.providers.finnhub import FinnhubProvider


@pytest.mark.asyncio
async def test_fetch_quote_parses_response(httpx_mock: HTTPXMock):
    import httpx
    httpx_mock.add_response(
        url=re.compile(r"https://finnhub\.io/.*"),
        json={"c": 34.124, "o": 34.0, "h": 34.3, "l": 33.9, "pc": 34.0},
    )
    async with httpx.AsyncClient() as client:
        provider = FinnhubProvider(client, api_key="test-key")
        quote = await provider.fetch_quote("USDTRY")

    assert quote.price == 34.124
    assert quote.open == 34.0
    assert quote.change_pct == pytest.approx((34.124 - 34.0) / 34.0 * 100, rel=1e-3)


@pytest.mark.asyncio
async def test_fetch_quote_raises_on_http_error(httpx_mock: HTTPXMock):
    import httpx
    from app.providers.base import ProviderError

    httpx_mock.add_response(url=re.compile(r"https://finnhub\.io/.*"), status_code=401)
    async with httpx.AsyncClient() as client:
        provider = FinnhubProvider(client, api_key="bad-key")
        with pytest.raises(ProviderError, match="401"):
            await provider.fetch_quote("USDTRY")


@pytest.mark.asyncio
async def test_fetch_quote_raises_on_http_error_401(httpx_mock: HTTPXMock):
    """Stocks-only adapter: any non-200 from Finnhub becomes a ProviderError."""
    import httpx
    from app.providers.base import ProviderError

    httpx_mock.add_response(url=re.compile(r"https://finnhub\.io/.*"), status_code=403)
    async with httpx.AsyncClient() as client:
        provider = FinnhubProvider(client, api_key="test-key")
        with pytest.raises(ProviderError, match="403"):
            await provider.fetch_quote("NOTREAL")
