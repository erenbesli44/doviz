"""
MarketService — orchestrates parallel quote fetches for grouped views.

Wraps QuoteService to fetch multiple quotes concurrently using asyncio.gather,
collecting partial failures into the errors dict rather than failing the whole request.
"""
import asyncio
import logging

from fastapi import HTTPException

from ..schemas.market import MarketOverviewResponse, MarketSummaryResponse
from ..schemas.quote import BatchQuoteResponse, QuoteResponse
from ..symbols.registry import SYMBOL_REGISTRY, symbols_by_category
from .quote_service import QuoteService

logger = logging.getLogger(__name__)

# The overview widget shows this curated list of top instruments
OVERVIEW_SYMBOLS = ["USD/TRY", "GAUTRY", "EUR/TRY", "NDX", "SPX"]


class MarketService:
    def __init__(self, quote_service: QuoteService) -> None:
        self._qs = quote_service

    async def get_overview(self) -> MarketOverviewResponse:
        quotes = await self._fetch_many(OVERVIEW_SYMBOLS)
        return MarketOverviewResponse(quotes=quotes)

    async def get_summary(self) -> MarketSummaryResponse:
        """Fetch all known instruments, grouped by category."""
        all_symbols = list(SYMBOL_REGISTRY.keys())
        quotes = await self._fetch_many_with_errors(all_symbols)

        def by_cat(cat: str) -> list[QuoteResponse]:
            return [q for q in quotes if q.data.category == cat]

        return MarketSummaryResponse(
            fx=by_cat("fx"),
            gold=by_cat("gold"),
            indexes=by_cat("index"),
            commodities=by_cat("commodity"),
            crypto=by_cat("crypto"),
        )

    async def get_batch(self, symbols: list[str]) -> BatchQuoteResponse:
        """Fetch a user-requested set of symbols; partial failures go into errors dict."""
        results: list[QuoteResponse] = []
        errors: dict[str, str] = {}

        async def fetch_one(sym: str) -> None:
            try:
                q = await self._qs.get_quote(sym)
                results.append(q)
            except HTTPException as e:
                errors[sym] = e.detail
            except Exception as e:
                errors[sym] = str(e)

        await asyncio.gather(*[fetch_one(s) for s in symbols])
        return BatchQuoteResponse(quotes=results, errors=errors)

    async def _fetch_many(self, symbols: list[str]) -> list[QuoteResponse]:
        """Fetch symbols concurrently; silently drops failures (best-effort overview)."""
        results = await asyncio.gather(
            *[self._qs.get_quote(s) for s in symbols],
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, QuoteResponse)]

    async def _fetch_many_with_errors(self, symbols: list[str]) -> list[QuoteResponse]:
        """Like _fetch_many but logs errors instead of silently dropping."""
        results = await asyncio.gather(
            *[self._qs.get_quote(s) for s in symbols],
            return_exceptions=True,
        )
        out = []
        for sym, result in zip(symbols, results):
            if isinstance(result, QuoteResponse):
                out.append(result)
            else:
                logger.debug("Summary skipping %s: %s", sym, result)
        return out
