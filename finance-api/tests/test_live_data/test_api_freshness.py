"""
API end-to-end freshness tests.

Validates that the running server responds with live, correctly-aged prices
for USD/TRY, WTI, Brent, and BTC/USD.

Usage — start the server first, then:

    uvicorn app.main:app --reload &
    pytest tests/test_live_data/test_api_freshness.py -m e2e -v

    # Or point at a deployed instance:
    BASE_URL=https://my-server.example.com pytest ... -m e2e -v
"""
import asyncio
import os
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest

# ── Load .env ─────────────────────────────────────────────────────────────────
_env = Path(__file__).parents[2] / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

pytestmark = pytest.mark.e2e

_BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get(path: str) -> dict:
    async with httpx.AsyncClient(base_url=_BASE_URL, timeout=10.0) as client:
        try:
            resp = await client.get(path)
        except httpx.ConnectError:
            pytest.skip(f"Server not reachable at {_BASE_URL} — start it first")
        resp.raise_for_status()
        return resp.json()


def _age_seconds(fetched_at_str: str) -> float:
    """Seconds elapsed since the provider fetched the data."""
    dt = datetime.fromisoformat(fetched_at_str.replace("Z", "+00:00"))
    return (datetime.now(UTC) - dt).total_seconds()


# ── USD/TRY ───────────────────────────────────────────────────────────────────

async def test_usdtry_price_in_range():
    body = await _get("/v1/quotes/USD-TRY")
    price = body["data"]["price"]
    assert 25.0 <= price <= 60.0, f"USD/TRY price {price:.4f} outside plausible range [25, 60]"


async def test_usdtry_is_marked_live():
    body = await _get("/v1/quotes/USD-TRY")
    assert body["meta"]["is_live"] is True, "USD/TRY must be marked is_live=True"


async def test_usdtry_fetched_at_within_ttl():
    """fetched_at must be within TTL(30s) + 5s buffer."""
    body = await _get("/v1/quotes/USD-TRY")
    age = _age_seconds(body["meta"]["fetched_at"])
    assert age <= 35, (
        f"USD/TRY fetched_at is {age:.0f}s old — expected ≤35s (TTL=30s + buffer)"
    )


# ── WTI crude oil ─────────────────────────────────────────────────────────────

async def test_wti_price_in_range():
    body = await _get("/v1/quotes/WTI")
    price = body["data"]["price"]
    assert 30.0 <= price <= 200.0, f"WTI price ${price:.2f} outside plausible range [30, 200]"


async def test_wti_is_marked_live():
    body = await _get("/v1/quotes/WTI")
    assert body["meta"]["is_live"] is True


async def test_wti_fetched_at_within_ttl():
    """fetched_at within TTL(60s) + 5s buffer."""
    body = await _get("/v1/quotes/WTI")
    age = _age_seconds(body["meta"]["fetched_at"])
    assert age <= 65, f"WTI fetched_at is {age:.0f}s old — expected ≤65s (TTL=60s + buffer)"


# ── Brent crude oil ───────────────────────────────────────────────────────────

async def test_brent_price_in_range():
    body = await _get("/v1/quotes/BRENT")
    price = body["data"]["price"]
    assert 30.0 <= price <= 200.0, f"Brent price ${price:.2f} outside plausible range [30, 200]"


async def test_brent_fetched_at_within_ttl():
    """Brent TTL is now 300s. FMP source itself lags ~15 min; this only
    checks the cache is being refreshed at the configured interval.
    """
    body = await _get("/v1/quotes/BRENT")
    age = _age_seconds(body["meta"]["fetched_at"])
    assert age <= 310, (
        f"Brent fetched_at is {age:.0f}s old — expected ≤310s (TTL=300s + buffer). "
        "Note: FMP free tier adds ~15-min market lag on top of this."
    )


# ── Bitcoin ───────────────────────────────────────────────────────────────────

async def test_btc_price_in_range():
    body = await _get("/v1/quotes/BTC-USD")
    price = body["data"]["price"]
    assert 10_000 <= price <= 500_000, f"BTC price ${price:,.0f} outside plausible range"


async def test_btc_is_marked_live():
    body = await _get("/v1/quotes/BTC-USD")
    assert body["meta"]["is_live"] is True


async def test_btc_fetched_at_within_ttl():
    """BTC TTL=60s + Finnhub WS patch (<30s). Allow 90s total."""
    body = await _get("/v1/quotes/BTC-USD")
    age = _age_seconds(body["meta"]["fetched_at"])
    assert age <= 90, (
        f"BTC fetched_at is {age:.0f}s old — expected ≤90s (TTL=60s + 30s WS patch buffer)"
    )


# ── Cache refresh smoke test ──────────────────────────────────────────────────

async def test_usdtry_cache_refreshes_after_ttl():
    """Double-fetch with TTL+5s gap: the second fetched_at must advance.

    This confirms the background refresh loop is running and that
    stale-while-revalidate is actually updating the cache.
    """
    first = await _get("/v1/quotes/USD-TRY")
    first_ts_str = first["meta"]["fetched_at"]

    await asyncio.sleep(35)  # exceed TTL=30s

    second = await _get("/v1/quotes/USD-TRY")
    second_ts_str = second["meta"]["fetched_at"]

    first_ts = datetime.fromisoformat(first_ts_str.replace("Z", "+00:00"))
    second_ts = datetime.fromisoformat(second_ts_str.replace("Z", "+00:00"))

    assert second_ts > first_ts, (
        f"fetched_at did not advance after 35s: "
        f"first={first_ts.isoformat()}, second={second_ts.isoformat()}"
    )
