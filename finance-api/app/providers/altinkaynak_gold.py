"""
Altınkaynak Kapalıçarşı Gold provider.

Fetches physical gold prices from the Altınkaynak static JSON endpoint,
which reflects the Istanbul Grand Bazaar (Kapalıçarşı) market.

Endpoint: https://static.altinkaynak.com/public/Gold
Returns a list of gold types with Alış (buy / bid) and Satış (sell / ask) prices.

Supported external symbols (the "Kod" field):
  HH_T  — Has Toptan   (fine gold wholesale, 24K, ref price for Kapalıçarşı)
  GAT   — Gram Toptan  (gram wholesale)
  CH_T  — Külçe Toptan (bar wholesale)

The Alış (bid) price is used as the reference price because it's closest
to international spot and is the standard reference shown on Turkish sites.

This provider does NOT return change_pct — it returns 0.0. The caller
(quote_service._fetch_derived) computes change_pct from the XAU/USD and
USD/TRY Istanbul-day changes.
"""
import logging
from datetime import UTC, datetime

import httpx

from .base import ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

_URL = "https://static.altinkaynak.com/public/Gold"
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; finance-api/0.1)",
    "Accept": "application/json",
    "Referer": "https://www.altinkaynak.com/",
}
# Supported Kod values
_KNOWN_CODES = {"HH_T", "GAT", "CH_T"}


class AltinkaynakGoldProvider:
    """Istanbul Kapalıçarşı physical gold prices via static.altinkaynak.com."""

    provider_id = "altinkaynak_gold"

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        """
        Fetch the Kapalıçarşı gold price for the given Kod (e.g. "HH_T").
        Returns the Alış (bid) price. change_pct is always 0.0 — the caller
        must compute it from reference indices.
        """
        try:
            resp = await self._client.get(_URL, headers=_HEADERS, timeout=8.0)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ProviderError(
                self.provider_id, external_symbol, f"HTTP {e.response.status_code}"
            ) from e
        except httpx.RequestError as e:
            raise ProviderError(self.provider_id, external_symbol, f"request error: {e}") from e

        try:
            data = resp.json()
        except Exception as e:
            raise ProviderError(self.provider_id, external_symbol, f"JSON parse error: {e}") from e

        if not isinstance(data, list):
            raise ProviderError(self.provider_id, external_symbol, "unexpected response structure")

        target_kod = external_symbol.upper()
        entry = next((item for item in data if item.get("Kod") == target_kod), None)
        if entry is None:
            available = [item.get("Kod") for item in data]
            raise ProviderError(
                self.provider_id,
                external_symbol,
                f"Kod {target_kod!r} not found; available: {available}",
            )

        price = self._parse_turkish_number(entry["Alis"])
        fetched_at = self._parse_timestamp(entry.get("GuncellenmeZamani"))

        return RawQuote(
            price=price,
            change_pct=0.0,  # computed by caller from XAU + USDTRY changes
            fetched_at=fetched_at,
        )

    async def fetch_history(
        self, external_symbol: str, hours: int = 24
    ) -> list[RawHistoryPoint]:
        # Static endpoint has no history — return empty list.
        return []

    async def is_healthy(self) -> bool:
        try:
            resp = await self._client.get(_URL, headers=_HEADERS, timeout=5.0)
            return resp.status_code == 200 and isinstance(resp.json(), list)
        except Exception:
            logger.warning("AltinkaynakGold health check failed", exc_info=True)
            return False

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _parse_turkish_number(value: str) -> float:
        """Convert Turkish-formatted number '6.828,97' → 6828.97"""
        return float(value.replace(".", "").replace(",", "."))

    @staticmethod
    def _parse_timestamp(value: str | None) -> datetime:
        """Parse 'dd.MM.yyyy HH:mm:ss' → UTC datetime. Falls back to now()."""
        if value:
            try:
                # Format: "20.03.2026 13:08:49"
                dt = datetime.strptime(value, "%d.%m.%Y %H:%M:%S")
                # Altınkaynak timestamps are in Istanbul time (UTC+3)
                from datetime import timezone, timedelta
                TRT = timezone(timedelta(hours=3))
                return dt.replace(tzinfo=TRT).astimezone(UTC)
            except ValueError:
                pass
        return datetime.now(UTC)
