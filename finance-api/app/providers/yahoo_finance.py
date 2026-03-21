"""
Yahoo Finance provider adapter (unofficial).

Used for: FX pairs (TRY crosses, EUR/USD, GBP/USD), commodities (gold, oil, gas),
indices (XU100, NDX, DAX), and as a fallback for many other symbols.

NOTE: This uses Yahoo Finance's unofficial JSON endpoint — no API key required
but the feed is inherently unstable. We do NOT use the yfinance library to keep
the dependency footprint minimal; instead we call the v8 chart API directly with httpx.

Change % is anchored to Istanbul midnight (00:00 TRT = 21:00 UTC previous day)
so that "daily change" matches what Turkish financial sites (BloombergHT, etc.) show.
If the hourly bars don't extend back far enough, we fall back to chartPreviousClose.
"""
import logging
from datetime import UTC, datetime, timedelta, timezone

import httpx

from .base import ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

# Turkey Standard Time — UTC+3, no DST
_TRT = timezone(timedelta(hours=3))

# Yahoo Finance chart API (v8) — no auth required
_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

# Rotate to query2 if query1 fails (Yahoo load balancing)
_BASE_FALLBACK = "https://query2.finance.yahoo.com/v8/finance/chart"

_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
}


def _istanbul_midnight_utc() -> datetime:
    """Return today's 00:00 TRT expressed as a UTC-aware datetime.

    Istanbul midnight = 21:00 UTC of the previous calendar day.
    Example: 2026-03-20 00:00 TRT → 2026-03-19 21:00 UTC
    """
    now_trt = datetime.now(_TRT)
    midnight_trt = now_trt.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight_trt.astimezone(UTC)


def _prev_close_at_istanbul_midnight(
    timestamps: list[int], closes: list[float | None]
) -> float | None:
    """Find the last valid close price at or before today's Istanbul midnight.

    Yahoo returns hourly bars as UNIX timestamps. We walk backwards and return
    the latest bar whose timestamp is <= the Istanbul midnight UTC cutoff.
    Returns None if no suitable bar exists (e.g., feed only goes back a few hours).
    """
    cutoff = _istanbul_midnight_utc()
    cutoff_ts = cutoff.timestamp()

    # Walk in reverse to find the most recent bar at or before the cutoff
    for ts, close in zip(reversed(timestamps), reversed(closes)):
        if ts <= cutoff_ts and close is not None:
            return float(close)
    return None


class YahooFinanceProvider:
    provider_id = "yahoo"

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def _get(self, symbol: str, params: dict) -> dict:
        for base in (_BASE, _BASE_FALLBACK):
            try:
                resp = await self._client.get(
                    f"{base}/{symbol}",
                    params=params,
                    headers=_HEADERS,
                )
                if resp.status_code == 200:
                    return resp.json()
            except httpx.RequestError:
                continue
        raise ProviderError(self.provider_id, symbol, "both Yahoo endpoints failed")

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        # Use 1h interval over 2 days — gives enough bars to find Istanbul midnight
        # while still returning regularMarketPrice in `meta` for the current price.
        data = await self._get(external_symbol, params={"interval": "1h", "range": "2d"})

        try:
            result = data["chart"]["result"][0]
            meta = result["meta"]
        except (KeyError, IndexError, TypeError) as e:
            raise ProviderError(self.provider_id, external_symbol, f"unexpected response structure: {e}") from e

        price = meta.get("regularMarketPrice")
        if price is None:
            raise ProviderError(self.provider_id, external_symbol, "null regularMarketPrice")

        price_f = float(price)
        market_state = meta.get("marketState", "").lower() or None

        # Yahoo's authoritative change fields — use these first.
        raw_change_pct = meta.get("regularMarketChangePercent")
        raw_change = meta.get("regularMarketChange")

        # chartPreviousClose = prior session close (always correct for session % change).
        # This is the reference Yahoo website uses and what EODFetcher needs.
        chart_prev = meta.get("chartPreviousClose") or meta.get("previousClose")
        prev_close_f: float | None = float(chart_prev) if chart_prev else None

        if raw_change_pct is not None:
            # Yahoo provides the authoritative session change — use it directly.
            change_pct = round(float(raw_change_pct), 4)
        elif prev_close_f:
            # Fall back to (price − prev_session_close) / prev_session_close.
            # This is correct at all times (open / closed / weekend).
            change_pct = round((price_f - prev_close_f) / prev_close_f * 100, 4)
        else:
            # Last resort: Istanbul-midnight anchor (intraday use only).
            try:
                timestamps = result.get("timestamp") or []
                closes = result.get("indicators", {}).get("quote", [{}])[0].get("close") or []
                istanbul_prev = _prev_close_at_istanbul_midnight(timestamps, closes)
            except Exception:
                istanbul_prev = None
            change_pct = ((price_f - istanbul_prev) / istanbul_prev * 100) if istanbul_prev else 0.0

        change_value: float | None = float(raw_change) if raw_change is not None else (
            round(price_f - prev_close_f, 6) if prev_close_f else None
        )

        return RawQuote(
            price=price_f,
            change_pct=round(change_pct, 4),
            open=meta.get("regularMarketOpen"),
            high=meta.get("regularMarketDayHigh"),
            low=meta.get("regularMarketDayLow"),
            fetched_at=datetime.now(UTC),
            market_status=market_state,
            previous_close=prev_close_f,
            change_value=change_value,
        )

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        if hours <= 72:
            interval, range_, fmt = "60m", f"{max(1, hours // 24)}d", "%H:%M"
        elif hours <= 720:
            interval, range_, fmt = "1d", "30d", "%d %b"
        elif hours <= 2160:
            interval, range_, fmt = "1d", "90d", "%d %b"
        else:
            interval, range_, fmt = "1wk", "365d", "%b '%y"

        data = await self._get(external_symbol, params={"interval": interval, "range": range_})

        try:
            result = data["chart"]["result"][0]
            timestamps = result["timestamp"]
            closes = result["indicators"]["quote"][0]["close"]
        except (KeyError, IndexError, TypeError) as e:
            raise ProviderError(self.provider_id, external_symbol, f"history parse error: {e}") from e

        return [
            RawHistoryPoint(
                time=datetime.fromtimestamp(ts, UTC).strftime(fmt),
                value=round(float(close), 4),
            )
            for ts, close in zip(timestamps, closes)
            if close is not None
        ]

    async def is_healthy(self) -> bool:
        try:
            data = await self._get("EURUSD=X", params={"interval": "1d", "range": "1d"})
            return bool(data.get("chart", {}).get("result"))
        except Exception:
            logger.warning("Yahoo Finance health check failed", exc_info=True)
            return False
