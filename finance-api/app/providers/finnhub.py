"""
Finnhub provider adapter — stocks only (free tier).

Free-tier access: US stock quotes and candles (SPY, AAPL, NVDA, etc.)
Forex/OANDA endpoints require a paid Finnhub plan and are NOT used here.

Use Finnhub when you need individual US stock data as a primary or complementary
source. All symbols are passed through as-is (e.g. "SPY", "AAPL").

API docs: https://finnhub.io/docs/api/quote  /  stock-candles
"""
import logging
from datetime import UTC, datetime, timedelta

import httpx

from .base import MarketProvider, ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

_BASE = "https://finnhub.io/api/v1"


class FinnhubProvider:
    provider_id = "finnhub"

    def __init__(self, client: httpx.AsyncClient, api_key: str) -> None:
        self._client = client
        self._api_key = api_key

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        """Fetch a US stock quote.  external_symbol must be a plain ticker, e.g. 'SPY'."""
        try:
            resp = await self._client.get(
                f"{_BASE}/quote",
                params={"symbol": external_symbol, "token": self._api_key},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ProviderError(self.provider_id, external_symbol, f"HTTP {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise ProviderError(self.provider_id, external_symbol, f"request error: {e}") from e

        data = resp.json()
        price = data.get("c")  # current price
        if not price:
            raise ProviderError(self.provider_id, external_symbol, "empty price in response")

        prev_close = data.get("pc") or price
        change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0.0

        return RawQuote(
            price=float(price),
            change_pct=round(change_pct, 4),
            open=data.get("o"),
            high=data.get("h"),
            low=data.get("l"),
            fetched_at=datetime.now(UTC),
        )

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        """Fetch stock candles via Finnhub's /stock/candle endpoint."""
        now = int(datetime.now(UTC).timestamp())
        from_ = int((datetime.now(UTC) - timedelta(hours=hours)).timestamp())
        resolution = "60" if hours <= 72 else "D"

        try:
            resp = await self._client.get(
                f"{_BASE}/stock/candle",
                params={
                    "symbol": external_symbol,
                    "resolution": resolution,
                    "from": from_,
                    "to": now,
                    "token": self._api_key,
                },
            )
            resp.raise_for_status()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            raise ProviderError(self.provider_id, external_symbol, str(e)) from e

        data = resp.json()
        if data.get("s") != "ok" or not data.get("c"):
            raise ProviderError(self.provider_id, external_symbol, f"candle status: {data.get('s')}")

        return [
            RawHistoryPoint(
                time=datetime.fromtimestamp(ts, UTC).strftime("%H:%M"),
                value=round(float(close), 4),
            )
            for ts, close in zip(data["t"], data["c"])
        ]

    async def is_healthy(self) -> bool:
        try:
            resp = await self._client.get(
                f"{_BASE}/quote",
                params={"symbol": "SPY", "token": self._api_key},
            )
            if resp.status_code == 200:
                return bool(resp.json().get("c"))
            return False
        except Exception:
            logger.warning("Finnhub health check failed", exc_info=True)
            return False
