"""
Provider-level live integration tests.

These make REAL HTTP calls to external APIs (Yahoo Finance, CoinGecko, FMP).
They are skipped by default and must be run explicitly:

    pytest tests/test_live_data/test_provider_liveness.py -m live -v

Requirements:
  - FMP_API_KEY in environment (or .env file) for Brent/FMP tests
  - COINGECKO_API_KEY optional (free tier works without it)

Do NOT add to CI — these hit real network endpoints.
"""
import os
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest

# ── Load .env so tests work when run from project root ───────────────────────
_env = Path(__file__).parents[2] / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

from app.providers.coingecko import CoinGeckoProvider
from app.providers.fmp import FMPProvider
from app.providers.yahoo_finance import YahooFinanceProvider

pytestmark = pytest.mark.live


# ── Shared fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
async def http_client():
    async with httpx.AsyncClient(timeout=10.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
        yield client


@pytest.fixture
async def yahoo(http_client):
    return YahooFinanceProvider(http_client)


@pytest.fixture
async def coingecko(http_client):
    return CoinGeckoProvider(http_client, os.environ.get("COINGECKO_API_KEY", ""))


@pytest.fixture
async def fmp(http_client):
    api_key = os.environ.get("FMP_API_KEY", "")
    if not api_key:
        pytest.skip("FMP_API_KEY not set — skipping FMP tests")
    return FMPProvider(http_client, api_key)


# ── USD/TRY ───────────────────────────────────────────────────────────────────

async def test_yahoo_usdtry_price_in_range(yahoo):
    """USD/TRY via Yahoo Finance must return a real, fresh price."""
    quote = await yahoo.fetch_quote("USDTRY=X")

    assert quote.price > 0
    assert 25.0 <= quote.price <= 60.0, f"USD/TRY {quote.price:.4f} outside plausible range [25, 60]"

    age = (datetime.now(UTC) - quote.fetched_at).total_seconds()
    assert age < 5, f"fetched_at is {age:.1f}s old — provider did not set a fresh timestamp"


async def test_yahoo_usdtry_change_pct_is_reasonable(yahoo):
    """Daily change % for USD/TRY should not be implausibly large."""
    quote = await yahoo.fetch_quote("USDTRY=X")
    assert -10.0 <= quote.change_pct <= 10.0, (
        f"change_pct={quote.change_pct:.3f}% looks implausible for USD/TRY"
    )


# ── WTI crude oil ─────────────────────────────────────────────────────────────

async def test_yahoo_wti_price_in_range(yahoo):
    """WTI crude oil futures (CL=F) via Yahoo must return a real price."""
    quote = await yahoo.fetch_quote("CL=F")

    assert quote.price > 0
    assert 30.0 <= quote.price <= 200.0, f"WTI ${quote.price:.2f} outside plausible range [30, 200]"

    age = (datetime.now(UTC) - quote.fetched_at).total_seconds()
    assert age < 5


async def test_yahoo_wti_has_ohlc_fields(yahoo):
    """WTI quote should include open/high/low (futures always have OHLC)."""
    quote = await yahoo.fetch_quote("CL=F")
    assert quote.open is not None, "open price missing"
    assert quote.high is not None, "high price missing"
    assert quote.low is not None, "low price missing"


# ── Brent crude oil ───────────────────────────────────────────────────────────

async def test_fmp_brent_price_in_range(fmp):
    """Brent (BZUSD) via FMP free tier must return a valid price.

    NOTE: FMP free tier has a ~15-min provider delay. With TTL=300s the API
    refresh interval is 5 min, so Brent data may lag the market by up to ~20 min.
    This test only validates the price is structurally correct, not 'live'.
    """
    quote = await fmp.fetch_quote("BZUSD")

    assert quote.price > 0
    assert 30.0 <= quote.price <= 200.0, f"Brent ${quote.price:.2f} outside plausible range [30, 200]"


async def test_yahoo_brent_fallback_price_in_range(yahoo):
    """Brent fallback (BZ=F) via Yahoo must return a real price."""
    quote = await yahoo.fetch_quote("BZ=F")

    assert quote.price > 0
    assert 30.0 <= quote.price <= 200.0, f"Brent(Yahoo) ${quote.price:.2f} outside plausible range"

    age = (datetime.now(UTC) - quote.fetched_at).total_seconds()
    assert age < 5


async def test_brent_fmp_vs_yahoo_divergence_within_5pct(fmp, yahoo):
    """FMP and Yahoo Brent prices must agree within 5% (FMP is slightly delayed)."""
    q_fmp = await fmp.fetch_quote("BZUSD")
    q_yahoo = await yahoo.fetch_quote("BZ=F")

    divergence = abs(q_fmp.price - q_yahoo.price) / q_yahoo.price * 100
    assert divergence <= 5.0, (
        f"Brent FMP={q_fmp.price:.2f} vs Yahoo={q_yahoo.price:.2f}: "
        f"{divergence:.2f}% divergence — FMP data may be stale"
    )


# ── Bitcoin ───────────────────────────────────────────────────────────────────

async def test_coingecko_btc_price_in_range(coingecko):
    """BTC/USD via CoinGecko must return a real, fresh price."""
    quote = await coingecko.fetch_quote("bitcoin")

    assert quote.price > 0
    assert 10_000 <= quote.price <= 500_000, (
        f"BTC ${quote.price:,.0f} outside plausible range [10k, 500k]"
    )

    age = (datetime.now(UTC) - quote.fetched_at).total_seconds()
    assert age < 5


async def test_coingecko_btc_change_pct_is_reasonable(coingecko):
    """BTC 24h change % must be finite and within plausible bounds."""
    quote = await coingecko.fetch_quote("bitcoin")
    assert -50.0 <= quote.change_pct <= 50.0, (
        f"change_pct={quote.change_pct:.3f}% — looks implausible"
    )


async def test_yahoo_btc_fallback_price_in_range(yahoo):
    """Yahoo BTC-USD fallback must also return a valid price."""
    quote = await yahoo.fetch_quote("BTC-USD")

    assert quote.price > 0
    assert 10_000 <= quote.price <= 500_000, (
        f"BTC(Yahoo) ${quote.price:,.0f} outside plausible range"
    )


async def test_btc_coingecko_vs_yahoo_divergence_within_2pct(coingecko, yahoo):
    """CoinGecko and Yahoo BTC prices must agree within 2%."""
    q_cg = await coingecko.fetch_quote("bitcoin")
    q_yf = await yahoo.fetch_quote("BTC-USD")

    divergence = abs(q_cg.price - q_yf.price) / q_yf.price * 100
    assert divergence <= 2.0, (
        f"BTC CoinGecko={q_cg.price:,.2f} vs Yahoo={q_yf.price:,.2f}: "
        f"{divergence:.2f}% divergence exceeds 2%"
    )


# ── Cross-triangulation ───────────────────────────────────────────────────────

async def test_usdtry_triangulation(yahoo):
    """USD/TRY must be consistent with EUR/TRY ÷ EUR/USD within 1%.

    Arithmetic: USDTRY ≈ EURTRY / EURUSD
    Any significant deviation signals a stale or incorrect feed.
    """
    q_usdtry = await yahoo.fetch_quote("USDTRY=X")
    q_eurusd = await yahoo.fetch_quote("EURUSD=X")
    q_eurtry = await yahoo.fetch_quote("EURTRY=X")

    derived = q_eurtry.price / q_eurusd.price
    divergence = abs(q_usdtry.price - derived) / q_usdtry.price * 100

    assert divergence <= 1.0, (
        f"USD/TRY triangulation mismatch: "
        f"direct={q_usdtry.price:.4f}, "
        f"EURTRY/EURUSD derived={derived:.4f}, "
        f"deviation={divergence:.3f}%"
    )
