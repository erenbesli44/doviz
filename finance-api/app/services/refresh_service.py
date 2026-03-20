"""
RefreshService — pre-warms the quote cache on startup, then keeps it fresh.

Strategy per symbol type:
- Real-time symbols (TTL ≤ 60s):   refresh at TTL × 0.8 to keep cache hot
- Delayed symbols  (TTL > 60s):    refresh at TTL × 0.8 (still much less than TTL)
- Derived symbols (GAUTRY, etc.):  follow their configured TTL × 0.8

On startup all symbols are fetched concurrently to eliminate cold-start latency.
"""
import asyncio
import logging

from ..symbols.registry import SYMBOL_REGISTRY
from .event_bus import EventBus
from .quote_service import QuoteService

logger = logging.getLogger(__name__)

# Symbols refreshed by RefreshService; derived ones depend on their sub-quotes being fresh
_SKIP = frozenset({"GAUTRY", "HAREM1KG", "GAGTRY"})


class RefreshService:
    def __init__(self, quote_service: QuoteService, event_bus: EventBus) -> None:
        self._qs = quote_service
        self._bus = event_bus
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        """Warm cache for all symbols, then kick off background refresh loop."""
        await self._warm_cache()
        self._task = asyncio.create_task(self._refresh_loop(), name="refresh_loop")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _warm_cache(self) -> None:
        """Fetch all symbols concurrently so the first user request is instant."""
        symbols = [s for s in SYMBOL_REGISTRY if s not in _SKIP]
        logger.info("Warming cache for %d symbols…", len(symbols))
        results = await asyncio.gather(
            *[self._safe_fetch(sym) for sym in symbols],
            return_exceptions=True,
        )
        failed = [sym for sym, r in zip(symbols, results) if isinstance(r, Exception)]
        if failed:
            logger.warning("Cache warm failed for: %s", failed)
        else:
            logger.info("Cache warm complete.")

    async def _refresh_loop(self) -> None:
        """Continuously refresh symbols before their TTL expires."""
        while True:
            for symbol, config in SYMBOL_REGISTRY.items():
                if symbol in _SKIP:
                    continue
                asyncio.create_task(self._safe_fetch(symbol), name=f"refresh:{symbol}")

            # Wait for the shortest TTL × 0.8 across non-skip symbols
            min_ttl = min(
                c.ttl_seconds for s, c in SYMBOL_REGISTRY.items() if s not in _SKIP
            )
            await asyncio.sleep(min_ttl * 0.8)

    async def _safe_fetch(self, symbol: str) -> None:
        try:
            quote = await self._qs.get_quote(symbol)
            await self._bus.publish(symbol, quote)
        except Exception as e:
            logger.debug("Refresh failed for %s: %s", symbol, e)
