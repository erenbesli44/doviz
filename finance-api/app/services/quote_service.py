"""
QuoteService — the core of the app.

Responsibilities:
  1. Check in-memory cache (return immediately on hit)
  2. Look up symbol config from the registry
  3. Try the primary provider (with timeout)
  4. On failure, try fallback provider
  5. If both fail, raise HTTPException 503
  6. Normalize raw provider data → QuoteResponse
  7. Populate cache with the result

The service does not know about HTTP or routing — that is the API layer's job.
"""
import asyncio
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from fastapi import HTTPException

from ..cache.memory import MemoryCache
from ..providers.base import MarketProvider, ProviderError, RawQuote
from ..providers.registry import ProviderRegistry
from ..schemas.history import HistoryPoint, HistoryResponse
from ..schemas.quote import QuoteData, QuoteMeta, QuoteResponse
from ..symbols.registry import SymbolConfig, get_symbol_config

if TYPE_CHECKING:
    from .event_bus import EventBus

logger = logging.getLogger(__name__)


class QuoteService:
    def __init__(self, providers: ProviderRegistry, cache: MemoryCache, timeout: float = 5.0, event_bus: "EventBus | None" = None, app_state: object | None = None) -> None:
        self._providers = providers
        self._cache = cache
        self._timeout = timeout
        self._event_bus = event_bus
        self._app_state = app_state  # for real-time overrides (e.g. btc_realtime)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_quote(self, symbol: str) -> QuoteResponse:
        """Fetch a single normalized quote. Raises 404 for unknown symbols, 503 on failure."""
        config = get_symbol_config(symbol)
        if config is None:
            raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol!r}")

        cache_key = config.internal

        # Real-time override: use Finnhub WS price for BTC/USD if < 30s old
        if config.internal == "BTC/USD" and self._app_state is not None:
            rt = getattr(self._app_state, "btc_realtime", None)
            if rt and (datetime.now(UTC).timestamp() - rt["ts"]) < 30:
                import time as _time
                cached = await self._cache.get(cache_key)
                base = cached or await self._cache.get_stale(cache_key)
                if base is not None:
                    # Patch price from real-time feed; keep everything else
                    patched = QuoteResponse(
                        data=QuoteData(
                            symbol=base.data.symbol, name=base.data.name,
                            price=rt["price"], change_pct=base.data.change_pct,
                            open=base.data.open, high=base.data.high, low=base.data.low,
                            currency=base.data.currency, category=base.data.category,
                            unit=base.data.unit,
                        ),
                        meta=QuoteMeta(
                            provider="finnhub_ws", is_live=True, delay_minutes=None,
                            fetched_at=datetime.fromtimestamp(rt["ts"], tz=UTC),
                            market_status=base.meta.market_status,
                        ),
                    )
                    return patched

        # Check cache first — avoids hitting providers on every request
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Stale-while-revalidate: serve expired value immediately and refresh in background
        stale = await self._cache.get_stale(cache_key)
        if stale is not None:
            asyncio.create_task(self._background_refresh(config))
            return stale

        # Use a per-key lock to prevent cache stampede on cold keys
        async with self._cache.lock(cache_key):
            # Re-check after acquiring lock (another coroutine may have populated it)
            cached = await self._cache.get(cache_key)
            if cached is not None:
                return cached

            response = await self._fetch_with_fallback(config)
            await self._cache.set(cache_key, response, ttl_seconds=config.ttl_seconds)
            return response

    async def _background_refresh(self, config: SymbolConfig) -> None:
        """Refresh a symbol in the background and update the cache silently."""
        try:
            response = await self._fetch_with_fallback(config)
            await self._cache.set(config.internal, response, ttl_seconds=config.ttl_seconds)
            if self._event_bus is not None:
                await self._event_bus.publish(config.internal, response)
        except Exception as e:
            logger.warning("Background refresh failed for %s: %s", config.internal, e)

    async def get_history(self, symbol: str, hours: int = 24) -> HistoryResponse:
        """Fetch sparkline/OHLC history for a symbol."""
        config = get_symbol_config(symbol)
        if config is None:
            raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol!r}")

        cache_key = f"{config.internal}:history:{hours}"
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        provider = self._providers.get(config.primary_provider)
        try:
            raw_points = await asyncio.wait_for(
                provider.fetch_history(config.external_primary, hours),
                timeout=self._timeout,
            )
            is_live = config.is_live
            provider_id = config.primary_provider
        except (ProviderError, TimeoutError, Exception) as e:
            logger.warning("History fetch failed for %s via %s: %s", symbol, config.primary_provider, e)
            # Try fallback if available
            if config.fallback_provider:
                fp = self._providers.get(config.fallback_provider)
                raw_points = await asyncio.wait_for(
                    fp.fetch_history(config.external_fallback or config.external_primary, hours),
                    timeout=self._timeout,
                )
                is_live = False
                provider_id = config.fallback_provider
            else:
                raw_points = []
                is_live = False
                provider_id = config.primary_provider

        result = HistoryResponse(
            symbol=config.internal,
            points=[HistoryPoint(time=p.time, value=p.value) for p in raw_points],
            provider=provider_id,
            is_live=is_live,
            fetched_at=datetime.now(UTC),
        )
        # History caches longer than the quote TTL
        await self._cache.set(cache_key, result, ttl_seconds=config.ttl_seconds * 4)
        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _fetch_with_fallback(self, config: SymbolConfig) -> QuoteResponse:
        """Try primary provider, fall back if it fails, raise 503 if both fail."""
        # Derived symbols are computed from two other quotes, not a direct provider call.
        if config.primary_provider == "derived":
            return await self._fetch_derived(config)

        primary = self._providers.get(config.primary_provider)

        try:
            raw = await self._fetch(primary, config.external_primary)
            return self._normalize(raw, config, provider_id=config.primary_provider, is_live=config.is_live)
        except (ProviderError, TimeoutError, Exception) as primary_err:
            logger.warning(
                "Primary provider %s failed for %s: %s",
                config.primary_provider, config.internal, primary_err,
            )

        if config.fallback_provider is None:
            raise HTTPException(
                status_code=503,
                detail=f"Provider unavailable for {config.internal} and no fallback configured.",
            )

        fallback = self._providers.get(config.fallback_provider)
        fallback_symbol = config.external_fallback or config.external_primary

        try:
            raw = await self._fetch(fallback, fallback_symbol)
            # Fallback data is always treated as delayed, regardless of the symbol config
            return self._normalize(raw, config, provider_id=config.fallback_provider, is_live=False)
        except (ProviderError, TimeoutError, Exception) as fallback_err:
            logger.error(
                "Fallback provider %s also failed for %s: %s",
                config.fallback_provider, config.internal, fallback_err,
            )
            raise HTTPException(
                status_code=503,
                detail=f"All providers unavailable for {config.internal}.",
            )

    async def _fetch_derived(self, config: SymbolConfig) -> QuoteResponse:
        """Compute GAUTRY / HAREM1KG from live XAU/USD × USD/TRY prices.

        Both sub-quotes go through the normal cache+fallback path so they
        benefit from caching and won't count double against provider rate limits.
        """
        _TROY_OZ_TO_GRAMS = 31.1035

        try:
            xau = await self.get_quote("XAU/USD")
            usdtry = await self.get_quote("USD/TRY")
        except HTTPException as e:
            raise HTTPException(
                status_code=503,
                detail=f"Cannot derive {config.internal}: sub-quote unavailable ({e.detail})",
            ) from e

        xau_usd = xau.data.price          # USD per troy oz
        usd_try_rate = usdtry.data.price  # TRY per 1 USD

        if config.internal == "GAUTRY":
            # (USD/troy_oz) ÷ 31.1035 g/troy_oz × TRY/USD  →  TRY per gram
            price = (xau_usd / _TROY_OZ_TO_GRAMS) * usd_try_rate
        elif config.internal == "HAREM1KG":
            # same formula × 1000  →  TRY per kg
            price = (xau_usd / _TROY_OZ_TO_GRAMS) * usd_try_rate * 1000
        else:
            raise ProviderError("derived", config.internal, "unknown derived symbol")

        raw = RawQuote(
            price=round(price, 2),
            change_pct=round(xau.data.change_pct, 4),  # track gold's daily move
            fetched_at=datetime.now(UTC),
        )
        return self._normalize(raw, config, provider_id="derived", is_live=config.is_live)

    async def _fetch(self, provider: MarketProvider, symbol: str) -> RawQuote:
        """Wrap provider call with timeout."""
        return await asyncio.wait_for(
            provider.fetch_quote(symbol),
            timeout=self._timeout,
        )

    @staticmethod
    def _normalize(raw: RawQuote, config: SymbolConfig, provider_id: str, is_live: bool) -> QuoteResponse:
        """Convert RawQuote + SymbolConfig → the API's canonical QuoteResponse."""
        return QuoteResponse(
            data=QuoteData(
                symbol=config.internal,
                name=config.name,
                price=raw.price,
                change_pct=raw.change_pct,
                open=raw.open,
                high=raw.high,
                low=raw.low,
                currency=config.currency,
                category=config.category,
                unit=config.unit,
            ),
            meta=QuoteMeta(
                provider=provider_id,
                is_live=is_live,
                delay_minutes=config.delay_minutes if not is_live else None,
                fetched_at=raw.fetched_at,
                market_status=raw.market_status,
            ),
        )
