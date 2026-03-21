"""
Financial Modeling Prep (FMP) provider adapter — uses the /stable/ API.

v3 endpoints are deprecated ("Legacy Endpoint" → 403). The current API is:
  Quote:   GET /stable/quote?symbol=X&apikey=KEY
  History: GET /stable/historical-price-eod/light?symbol=X&from=YYYY-MM-DD&apikey=KEY

Free-plan coverage (tested 2026-03):
  ✓ US indices: ^GSPC, ^DJI, ^FTSE, ^N225
  ✓ Commodities: GCUSD (gold), SIUSD (silver), BZUSD (brent)
  ✓ Major FX: EURUSD, GBPUSD
  ✗ ^NDX, ^GDAXI, CLUSD, NGUSD, HGUSD, KWUSD, TRY pairs → 402 (premium)

History is end-of-day (daily bars) only on the free plan.
"""
import logging
from datetime import UTC, datetime, timedelta

import httpx

from .base import ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

_BASE = "https://financialmodelingprep.com/stable"


class FMPProvider:
    provider_id = "fmp"

    def __init__(self, client: httpx.AsyncClient, api_key: str) -> None:
        self._client = client
        self._api_key = api_key

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        try:
            resp = await self._client.get(
                f"{_BASE}/quote",
                params={"symbol": external_symbol, "apikey": self._api_key},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ProviderError(self.provider_id, external_symbol, f"HTTP {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise ProviderError(self.provider_id, external_symbol, f"request error: {e}") from e

        items = resp.json()
        if not items or not isinstance(items, list):
            raise ProviderError(self.provider_id, external_symbol, "empty response list")

        q = items[0]
        price = q.get("price")
        if price is None:
            raise ProviderError(self.provider_id, external_symbol, "null price in response")

        change_pct = float(q.get("changesPercentage") or 0.0)
        price_f = float(price)
        prev_close = q.get("previousClose")
        prev_close_f = float(prev_close) if prev_close is not None else None
        change_value = round(price_f - prev_close_f, 6) if prev_close_f is not None else None

        return RawQuote(
            price=price_f,
            change_pct=round(change_pct, 4),
            open=q.get("open"),
            high=q.get("dayHigh"),
            low=q.get("dayLow"),
            fetched_at=datetime.now(UTC),
            previous_close=prev_close_f,
            change_value=change_value,
        )

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        """FMP stable API only provides end-of-day (daily) history on the free plan.
        Returns daily closing prices going back `hours` worth of calendar time.
        """
        from_ = (datetime.now(UTC) - timedelta(hours=hours)).strftime("%Y-%m-%d")

        try:
            resp = await self._client.get(
                f"{_BASE}/historical-price-eod/light",
                params={"symbol": external_symbol, "from": from_, "apikey": self._api_key},
            )
            resp.raise_for_status()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            raise ProviderError(self.provider_id, external_symbol, str(e)) from e

        records = resp.json()  # list of {date, open, high, low, close, volume}
        if not isinstance(records, list):
            raise ProviderError(self.provider_id, external_symbol, f"unexpected history shape: {type(records)}")

        return [
            RawHistoryPoint(
                time=r.get("date", ""),
                value=round(float(r["close"]), 4),
            )
            for r in reversed(records)  # FMP returns newest-first → reverse to chronological
            if r.get("close") is not None
        ]

    async def is_healthy(self) -> bool:
        try:
            resp = await self._client.get(
                f"{_BASE}/quote",
                params={"symbol": "^GSPC", "apikey": self._api_key},
            )
            return resp.status_code == 200
        except Exception:
            logger.warning("FMP health check failed", exc_info=True)
            return False
