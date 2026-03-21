"""
FallbackPriceResolver — decides what price and metadata to serve for a symbol.

Decision algorithm (in priority order):

  Market OPEN:
    1. live_quote fresh (age <= freshness_window)       → source_type="live"
    2. live_quote stale (age > freshness_window)        → source_type="delayed"
    3. live_quote None, session store has snapshot      → source_type="last_intraday_snapshot"
    4. live_quote None, no snapshot                     → display_mode="no_data"

  Market CLOSED:
    1. session store has last close                     → source_type="last_session_close"
    2. session store empty → on-demand EOD fetch        → source_type="last_session_close"
    3. EOD fetch also fails                             → display_mode="no_data"
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..cache.session_store import SessionCloseStore
    from ..schemas.quote import QuoteResponse
    from ..services.eod_fetcher import EODFetcher
    from ..services.market_calendar import MarketCalendarService, SessionState
    from ..symbols.registry import SymbolConfig

logger = logging.getLogger(__name__)


@dataclass
class ResolvedPrice:
    price: float
    change_pct: float
    change_value: float | None
    source_type: str          # "live" | "delayed" | "last_intraday_snapshot" | "last_session_close"
    display_mode: str         # "live" | "last_completed_session" | "no_data"
    as_of: datetime           # tz-aware UTC reference for this price
    session_date: date
    is_stale: bool
    stale_reason: str | None
    next_market_open: datetime  # tz-aware UTC; == as_of when market is open


class FallbackPriceResolver:
    def __init__(
        self,
        calendar: "MarketCalendarService",
        session_store: "SessionCloseStore",
        eod_fetcher: "EODFetcher",
    ) -> None:
        self._calendar = calendar
        self._session_store = session_store
        self._eod_fetcher = eod_fetcher

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def resolve(
        self,
        symbol: str,
        config: "SymbolConfig",
        live_quote: "QuoteResponse | None",
        now_utc: datetime,
    ) -> ResolvedPrice:
        """Return a ResolvedPrice for the given symbol at now_utc."""
        exchange = getattr(config, "exchange", "FOREX")
        state = self._calendar.get_session_state(exchange, now_utc)
        freshness = self._calendar.freshness_window(exchange)

        if state.is_open:
            return self._resolve_open(symbol, live_quote, now_utc, state, freshness)
        return await self._resolve_closed(symbol, config, now_utc, state)

    def get_session_state(self, exchange_id: str, now_utc: datetime) -> "SessionState":
        """Delegate calendar lookup — allows callers to avoid importing MarketCalendarService."""
        return self._calendar.get_session_state(exchange_id, now_utc)

    # ------------------------------------------------------------------
    # Open-market resolution
    # ------------------------------------------------------------------

    def _resolve_open(
        self,
        symbol: str,
        live_quote: "QuoteResponse | None",
        now_utc: datetime,
        state: "SessionState",
        freshness: int,
    ) -> ResolvedPrice:
        if live_quote is not None:
            age = (now_utc - live_quote.meta.fetched_at).total_seconds()
            is_fresh = age <= freshness
            source_type = (
                "live" if (is_fresh and live_quote.meta.is_live) else "delayed"
            )
            return ResolvedPrice(
                price=live_quote.data.price,
                change_pct=live_quote.data.change_pct,
                change_value=getattr(live_quote.data, "change_value", None),
                source_type=source_type,
                display_mode="live",
                as_of=live_quote.meta.fetched_at,
                session_date=state.session_date,
                is_stale=not is_fresh,
                stale_reason="stale_cache" if not is_fresh else None,
                next_market_open=now_utc,
            )

        # No live quote at all — check session store for intraday snapshot
        snapshot = self._session_store.get(symbol)
        if snapshot is not None:
            return ResolvedPrice(
                price=snapshot.price,
                change_pct=snapshot.change_pct,
                change_value=snapshot.change_value,
                source_type="last_intraday_snapshot",
                display_mode="live",
                as_of=snapshot.as_of,
                session_date=state.session_date,
                is_stale=True,
                stale_reason="provider_unavailable",
                next_market_open=now_utc,
            )

        return self._no_data(state.session_date, now_utc)

    # ------------------------------------------------------------------
    # Closed-market resolution
    # ------------------------------------------------------------------

    async def _resolve_closed(
        self,
        symbol: str,
        config: "SymbolConfig",
        now_utc: datetime,
        state: "SessionState",
    ) -> ResolvedPrice:
        last_close = self._session_store.get(symbol)
        if last_close is not None:
            return ResolvedPrice(
                price=last_close.price,
                change_pct=last_close.change_pct,
                change_value=last_close.change_value,
                source_type="last_session_close",
                display_mode="last_completed_session",
                as_of=last_close.as_of,
                session_date=last_close.session_date,
                is_stale=False,
                stale_reason=None,
                next_market_open=state.next_open,
            )

        # Cold-start: no stored close → trigger on-demand EOD fetch
        logger.info("Cold-start EOD fetch for %s", symbol)
        fetched = await self._eod_fetcher.fetch_and_store(symbol, config)
        if fetched is not None:
            return ResolvedPrice(
                price=fetched.price,
                change_pct=fetched.change_pct,
                change_value=fetched.change_value,
                source_type="last_session_close",
                display_mode="last_completed_session",
                as_of=fetched.as_of,
                session_date=fetched.session_date,
                is_stale=False,
                stale_reason=None,
                next_market_open=state.next_open,
            )

        return self._no_data(state.session_date, state.next_open)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _no_data(session_date: date, next_open: datetime) -> ResolvedPrice:
        return ResolvedPrice(
            price=0.0,
            change_pct=0.0,
            change_value=None,
            source_type="last_session_close",
            display_mode="no_data",
            as_of=datetime.now(UTC),
            session_date=session_date,
            is_stale=True,
            stale_reason="no_data_available",
            next_market_open=next_open,
        )
