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


def _first_bar_after_istanbul_midnight(
    timestamps: list[int], closes: list[float | None]
) -> float | None:
    """Return the first valid close AFTER today's Istanbul midnight (00:00 TRT = 21:00 UTC).

    For COMEX gold and similar instruments that have a brief daily maintenance break
    ending at 22:00 UTC (01:00 TRT), this returns the session-open price that
    Turkish financial sites (doviz.com, BloombergHT) use as the daily change reference.
    Returns None if no bar exists after midnight (market not yet open).
    """
    cutoff_ts = _istanbul_midnight_utc().timestamp()
    for ts, close in zip(timestamps, closes):
        if ts >= cutoff_ts and close is not None:
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

        # Yahoo's authoritative change fields — kept as a last resort (they use
        # Yahoo's own session definition, not Istanbul midnight).
        raw_change_pct = meta.get("regularMarketChangePercent")
        raw_change = meta.get("regularMarketChange")

        # Prior session close. Prefer `previousClose` over `chartPreviousClose`:
        # the latter is the close BEFORE the chart window begins (e.g. 2 days
        # stale for range=2d) which is wrong for continuously-traded futures
        # like BZ=F that never gap across weekends.
        prev_close_raw = meta.get("previousClose") or meta.get("chartPreviousClose")
        prev_close_f: float | None = float(prev_close_raw) if prev_close_raw else None

        # Istanbul-midnight anchor (00:00 TRT = 21:00 UTC yesterday) so the
        # daily change matches Turkish financial sites (BloombergHT, doviz.com).
        timestamps = result.get("timestamp") or []
        try:
            closes = result.get("indicators", {}).get("quote", [{}])[0].get("close") or []
        except (KeyError, IndexError, TypeError):
            closes = []
        istanbul_prev = _prev_close_at_istanbul_midnight(timestamps, closes)

        # Futures contract rolls: the 20:00 UTC bar may reference the expiring
        # front-month while regularMarketPrice/previousClose tracks the new
        # one, producing a spurious multi-percent gap. When that happens, drop
        # the hourly anchor and fall back to previousClose.
        if (
            istanbul_prev is not None
            and prev_close_f
            and abs(istanbul_prev - prev_close_f) / prev_close_f > 0.03
        ):
            istanbul_prev = None

        day_ref = istanbul_prev or prev_close_f

        if day_ref:
            change_pct = round((price_f - day_ref) / day_ref * 100, 4)
        elif raw_change_pct is not None:
            change_pct = round(float(raw_change_pct), 4)
        else:
            change_pct = 0.0

        if day_ref:
            change_value: float | None = round(price_f - day_ref, 6)
        elif raw_change is not None:
            change_value = float(raw_change)
        else:
            change_value = None

        # Session-open price: first non-null bar after Istanbul midnight (00:00 TRT = 21:00 UTC).
        # Used by _fetch_derived to compute the intraday change for GAUTRY/GAGTRY
        # in a way that matches doviz.com (change from session open, not from
        # Friday's chartPreviousClose which would span the weekend gap).
        session_open_price = _first_bar_after_istanbul_midnight(timestamps, closes)

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
            session_open=session_open_price,
        )

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        if hours <= 24:
            # Anchor the window to today's Istanbul midnight (00:00 TRT = 21:00 UTC the day
            # before) so the 1-day chart starts exactly at the Turkish calendar boundary,
            # matching what BloombergHT and doviz.com show as the daily range.
            interval = "60m"
            fmt = "%H:%M"
            period1 = int(_istanbul_midnight_utc().timestamp())
            period2 = int(datetime.now(UTC).timestamp())
            params: dict = {"interval": interval, "period1": period1, "period2": period2}
        elif hours <= 72:
            interval, range_, fmt = "60m", f"{hours // 24}d", "%H:%M"
            params = {"interval": interval, "range": range_}
        elif hours <= 720:
            interval, range_, fmt = "1d", "30d", "%d %b"
            params = {"interval": interval, "range": range_}
        elif hours <= 2160:
            interval, range_, fmt = "1d", "90d", "%d %b"
            params = {"interval": interval, "range": range_}
        elif hours <= 8760:
            interval, range_, fmt = "1wk", "365d", "%b '%y"
            params = {"interval": interval, "range": range_}
        else:
            # 3-year window: Yahoo "5y" at weekly resolution
            interval, range_, fmt = "1wk", "5y", "%b '%y"
            params = {"interval": interval, "range": range_}

        data = await self._get(external_symbol, params=params)

        try:
            result = data["chart"]["result"][0]
            timestamps = result["timestamp"]
            closes = result["indicators"]["quote"][0]["close"]
        except (KeyError, IndexError, TypeError) as e:
            raise ProviderError(self.provider_id, external_symbol, f"history parse error: {e}") from e

        return [
            RawHistoryPoint(
                # Always format in Istanbul time (TRT = UTC+3, no DST) so hover labels
                # display the correct local time for Turkish users.
                time=datetime.fromtimestamp(ts, _TRT).strftime(fmt),
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
