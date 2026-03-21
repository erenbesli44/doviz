"""
RefreshService — pre-warms the quote cache on startup, then keeps it fresh.

Strategy per symbol type:
- Real-time symbols (TTL ≤ 60s):   refresh at TTL × 0.8 to keep cache hot
- Delayed symbols  (TTL > 60s):    refresh at TTL × 0.8 (still much less than TTL)
- Derived symbols (GAUTRY, etc.):  follow their configured TTL × 0.8

Exchange-transition detection:
- On each refresh cycle, per-exchange open/closed state is compared to the
  previous cycle. If an exchange transitions open → closed, an EOD fetch is
  triggered for all symbols on that exchange and the results are stored in
  the SessionCloseStore so the fallback resolver can serve them immediately.

On startup all symbols are fetched concurrently to eliminate cold-start latency.
"""
import asyncio
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from ..symbols.registry import SYMBOL_REGISTRY
from .event_bus import EventBus
from .quote_service import QuoteService

if TYPE_CHECKING:
    from ..services.eod_fetcher import EODFetcher
    from ..services.market_calendar import MarketCalendarService

logger = logging.getLogger(__name__)

# Symbols refreshed by RefreshService; derived ones depend on their sub-quotes being fresh
_SKIP = frozenset({"GAUTRY", "HAREM1KG", "GAGTRY"})


class RefreshService:
    def __init__(
        self,
        quote_service: QuoteService,
        event_bus: EventBus,
        calendar: "MarketCalendarService | None" = None,
        eod_fetcher: "EODFetcher | None" = None,
    ) -> None:
        self._qs = quote_service
        self._bus = event_bus
        self._calendar = calendar
        self._eod_fetcher = eod_fetcher
        self._task: asyncio.Task | None = None
        # Track per-exchange open/closed state to detect transitions
        self._prev_open: dict[str, bool] = {}

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
            now_utc = datetime.now(UTC)
            await self._detect_exchange_transitions(now_utc)

            for symbol, config in SYMBOL_REGISTRY.items():
                if symbol in _SKIP:
                    continue
                # Skip symbols whose market is currently closed AND we have stored data
                if self._is_market_closed_with_data(config.exchange, symbol, now_utc):
                    continue
                asyncio.create_task(self._safe_fetch(symbol), name=f"refresh:{symbol}")

            min_ttl = min(
                c.ttl_seconds for s, c in SYMBOL_REGISTRY.items() if s not in _SKIP
            )
            await asyncio.sleep(min_ttl * 0.8)

    def _is_market_closed_with_data(
        self, exchange: str, symbol: str, now_utc: datetime
    ) -> bool:
        """Return True when the market is closed and session store has data (skip refresh)."""
        if self._calendar is None or self._qs._session_store is None:
            return False
        state = self._calendar.get_session_state(exchange, now_utc)
        if state.is_open:
            return False
        return self._qs._session_store.get(symbol) is not None

    async def _detect_exchange_transitions(self, now_utc: datetime) -> None:
        """Check each exchange for an open→closed transition this cycle."""
        if self._calendar is None or self._eod_fetcher is None:
            return

        exchanges = {config.exchange for config in SYMBOL_REGISTRY.values()}
        for exchange_id in exchanges:
            if exchange_id == "UNKNOWN":
                continue
            state = self._calendar.get_session_state(exchange_id, now_utc)
            was_open = self._prev_open.get(exchange_id, True)  # assume open on first run

            if was_open and not state.is_open:
                # Market just closed → trigger EOD fetch for all symbols on this exchange
                symbols_for_exchange = [
                    sym for sym, cfg in SYMBOL_REGISTRY.items()
                    if cfg.exchange == exchange_id
                ]
                logger.info(
                    "Exchange %s closed. Triggering EOD fetch for %d symbols.",
                    exchange_id, len(symbols_for_exchange),
                )
                asyncio.create_task(
                    self._eod_fetcher.fetch_many(symbols_for_exchange),
                    name=f"eod:{exchange_id}",
                )

            self._prev_open[exchange_id] = state.is_open

    async def _safe_fetch(self, symbol: str) -> None:
        try:
            quote = await self._qs.get_quote(symbol)
            await self._bus.publish(symbol, quote)
        except Exception as e:
            logger.debug("Refresh failed for %s: %s", symbol, e)

