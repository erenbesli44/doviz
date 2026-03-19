"""
Harem Altın scraper adapter.

Used for: physical 1kg gold price from HaremAltin.com.tr (the local Turkish market).

This is a scraper — it parses a JSON endpoint embedded in the Harem Altın website.
It is inherently fragile and may break if the site changes its structure.
The adapter is intentionally isolated here so that swapping it for an official
data source or a community wrapper later requires touching only this file.

Data is marked as delayed (is_live=False) in the registry because it reflects
the last quote displayed on the website, not a real-time feed.
"""
import logging
import re
from datetime import UTC, datetime

import httpx

from .base import ProviderError, RawHistoryPoint, RawQuote

logger = logging.getLogger(__name__)

_URL = "https://www.haremaltın.com.tr/altin-fiyatlari"
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; finance-api/0.1)",
    "Accept": "text/html,application/xhtml+xml",
}


class HaremAltinProvider:
    provider_id = "harem_altin"

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def fetch_quote(self, external_symbol: str) -> RawQuote:
        """
        Scrapes the Harem Altın website HTML for the 1kg gold price.
        external_symbol is ignored (always returns 1kg TRY price).
        """
        try:
            resp = await self._client.get(_URL, headers=_HEADERS)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ProviderError(self.provider_id, external_symbol, f"HTTP {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise ProviderError(self.provider_id, external_symbol, f"request error: {e}") from e

        price = self._parse_1kg_price(resp.text)
        if price is None:
            raise ProviderError(self.provider_id, external_symbol, "could not parse 1kg price from page")

        return RawQuote(
            price=price,
            change_pct=0.0,  # Harem Altın page does not expose change %
            fetched_at=datetime.now(UTC),
        )

    def _parse_1kg_price(self, html: str) -> float | None:
        """
        Best-effort HTML parse for the 1kg gold price.
        This regex matches patterns like '1.000 Gram ... 123.456,78' or JSON blobs.
        Adjust the pattern if the site layout changes.
        """
        # Try to find a JSON-like data block first (more robust)
        json_match = re.search(r'"1000"\s*:\s*\{[^}]*"satis"\s*:\s*"?([\d.,]+)"?', html)
        if json_match:
            return self._parse_turkish_number(json_match.group(1))

        # Fallback: find table row containing "1000 Gram" and extract the next price
        row_match = re.search(
            r'1[.\s]?000\s*[Gg]ram[^<]*?</td>[^<]*<td[^>]*>([\d.,]+)', html
        )
        if row_match:
            return self._parse_turkish_number(row_match.group(1))

        return None

    @staticmethod
    def _parse_turkish_number(value: str) -> float:
        """Convert Turkish-formatted number '123.456,78' → 123456.78"""
        return float(value.replace(".", "").replace(",", "."))

    async def fetch_history(self, external_symbol: str, hours: int = 24) -> list[RawHistoryPoint]:
        # Harem Altın website does not provide historical data — return empty list.
        # History for gold TRY can be computed from XAU/USD × USD/TRY if needed.
        return []

    async def is_healthy(self) -> bool:
        try:
            resp = await self._client.get(_URL, headers=_HEADERS)
            return resp.status_code == 200
        except Exception:
            logger.warning("HaremAltin health check failed", exc_info=True)
            return False
