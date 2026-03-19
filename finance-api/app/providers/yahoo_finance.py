"""
Yahoo Finance provider adapter (unofficial).

Used for: BIST 100 (XU100.IS), and as a fallback for indices/commodities.

NOTE: This uses Yahoo Finance's unofficial JSON endpoint — no API key required
but the feed is inherently unstable and subject to BIST data being ~15 min delayed.
We do NOT use the yfinance library to keep the dependency footprint minimal; instead
we call the v8 chart API directly with httpx.

Data is explicitly marked as delayed in the symbol registry (is_live=False).
"""
import logging
from datetime import UTC, datetime

import httpx

from .base import ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

# Yahoo Finance chart API (v8) — no auth required
_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

# Rotate to query2 if query1 fails (Yahoo load balancing)
_BASE_FALLBACK = "https://query2.finance.yahoo.com/v8/finance/chart"

_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
}


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
        data = await self._get(external_symbol, params={"interval": "1d", "range": "5d"})

        try:
            meta = data["chart"]["result"][0]["meta"]
        except (KeyError, IndexError, TypeError) as e:
            raise ProviderError(self.provider_id, external_symbol, f"unexpected response structure: {e}") from e

        price = meta.get("regularMarketPrice")
        if price is None:
            raise ProviderError(self.provider_id, external_symbol, "null regularMarketPrice")

        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose") or price
        change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0.0

        market_state = meta.get("marketState", "").lower() or None

        return RawQuote(
            price=float(price),
            change_pct=round(change_pct, 4),
            open=meta.get("regularMarketOpen"),
            high=meta.get("regularMarketDayHigh"),
            low=meta.get("regularMarketDayLow"),
            fetched_at=datetime.now(UTC),
            market_status=market_state,
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
