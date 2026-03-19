"""
CoinGecko provider adapter.

Used for: live Bitcoin (BTC/USD) and other crypto prices.
API docs: https://docs.coingecko.com/v3.0.1/reference/simple-price

Free tier works without an API key but has tight rate limits.
Provide COINGECKO_API_KEY in .env to use the paid tier.
"""
import logging
from datetime import UTC, datetime

import httpx

from .base import MarketProvider, ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

_BASE = "https://api.coingecko.com/api/v3"


class CoinGeckoProvider:
    provider_id = "coingecko"

    def __init__(self, client: httpx.AsyncClient, api_key: str = "") -> None:
        self._client = client
        self._api_key = api_key  # empty → unauthenticated free tier

    def _headers(self) -> dict:
        if self._api_key:
            return {"x-cg-demo-api-key": self._api_key}
        return {}

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        """external_symbol is CoinGecko coin id, e.g. 'bitcoin'."""
        try:
            resp = await self._client.get(
                f"{_BASE}/simple/price",
                params={
                    "ids": external_symbol,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "false",
                },
                headers=self._headers(),
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ProviderError(self.provider_id, external_symbol, f"HTTP {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise ProviderError(self.provider_id, external_symbol, f"request error: {e}") from e

        data = resp.json().get(external_symbol)
        if not data or "usd" not in data:
            raise ProviderError(self.provider_id, external_symbol, "coin not found in response")

        price = float(data["usd"])
        change_pct = float(data.get("usd_24h_change") or 0.0)

        return RawQuote(
            price=price,
            change_pct=round(change_pct, 4),
            fetched_at=datetime.now(UTC),
        )

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        """CoinGecko market_chart returns UNIX-ms timestamps + prices."""
        days = max(1, hours // 24)
        try:
            resp = await self._client.get(
                f"{_BASE}/coins/{external_symbol}/market_chart",
                params={"vs_currency": "usd", "days": days, "interval": "hourly"},
                headers=self._headers(),
            )
            resp.raise_for_status()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            raise ProviderError(self.provider_id, external_symbol, str(e)) from e

        prices = resp.json().get("prices", [])
        return [
            RawHistoryPoint(
                time=datetime.fromtimestamp(ts / 1000, UTC).strftime("%H:%M"),
                value=round(float(price), 2),
            )
            for ts, price in prices
        ]

    async def is_healthy(self) -> bool:
        try:
            resp = await self._client.get(f"{_BASE}/ping", headers=self._headers())
            return resp.status_code == 200
        except Exception:
            logger.warning("CoinGecko health check failed", exc_info=True)
            return False
