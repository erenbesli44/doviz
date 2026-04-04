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

When a MarketCalendarService + SessionCloseStore + FallbackPriceResolver are
injected (optional), the service additionally:
  - Short-circuits to the session store for closed-market requests
  - Saves an intraday snapshot on every successful provider fetch
  - Enriches QuoteMeta with display_mode / source_type / session context
  - Falls back to the session store (or lazy EOD fetch) on provider failure

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
    from ..cache.session_store import SessionCloseData, SessionCloseStore
    from ..services.event_bus import EventBus
    from ..services.fallback_resolver import FallbackPriceResolver, ResolvedPrice
    from ..services.market_calendar import MarketCalendarService, SessionState

logger = logging.getLogger(__name__)


class QuoteService:
    def __init__(
        self,
        providers: ProviderRegistry,
        cache: MemoryCache,
        timeout: float = 5.0,
        event_bus: "EventBus | None" = None,
        app_state: object | None = None,
        calendar: "MarketCalendarService | None" = None,
        session_store: "SessionCloseStore | None" = None,
        fallback_resolver: "FallbackPriceResolver | None" = None,
        fmp_blocked: set[str] | None = None,
    ) -> None:
        self._providers = providers
        self._cache = cache
        self._timeout = timeout
        self._event_bus = event_bus
        self._app_state = app_state
        self._calendar = calendar
        self._session_store = session_store
        self._fallback_resolver = fallback_resolver
        self._fmp_blocked = fmp_blocked or set()

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
                cached = await self._cache.get(cache_key)
                base = cached or await self._cache.get_stale(cache_key)
                if base is not None:
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

        # ── Fast path: closed market ──────────────────────────────────────────
        if self._calendar is not None and self._session_store is not None:
            now_utc = datetime.now(UTC)
            state = self._calendar.get_session_state(config.exchange, now_utc)
            if not state.is_open:
                last_close = self._session_store.get(config.internal)
                if last_close is not None:
                    return _build_closed_response(config, last_close, state)

                # Cold-start on closed market: fetch proper EOD data (daily bars)
                # rather than calling the live provider (which gives change_pct=0.0).
                if self._fallback_resolver is not None:
                    resolved = await self._fallback_resolver.resolve(
                        symbol=config.internal,
                        config=config,
                        live_quote=None,
                        now_utc=now_utc,
                    )
                    if resolved.display_mode != "no_data":
                        return _build_from_resolved(config, resolved)
                # EOD unavailable → fall through to live provider as last resort

        # ── Standard cache → provider flow ──────────────────────────────────
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return self._enrich_live(cached, config)

        stale = await self._cache.get_stale(cache_key)
        if stale is not None:
            asyncio.create_task(self._background_refresh(config))
            return self._enrich_live(stale, config)

        async with self._cache.lock(cache_key):
            cached = await self._cache.get(cache_key)
            if cached is not None:
                return self._enrich_live(cached, config)

            try:
                response = await self._fetch_with_fallback(config)
            except HTTPException as exc:
                if exc.status_code == 503 and self._fallback_resolver is not None:
                    # All providers failed — try resolver (lazy EOD or stored snapshot)
                    now_utc = datetime.now(UTC)
                    resolved = await self._fallback_resolver.resolve(
                        symbol=config.internal,
                        config=config,
                        live_quote=None,
                        now_utc=now_utc,
                    )
                    if resolved.display_mode != "no_data":
                        return _build_from_resolved(config, resolved)
                raise

            await self._cache.set(cache_key, response, ttl_seconds=config.ttl_seconds)
            # Record intraday snapshot in session store for future closed-market fallback
            self._snapshot(config, response)
            return self._enrich_live(response, config)

    async def _background_refresh(self, config: SymbolConfig) -> None:
        """Refresh a symbol in the background and update the cache silently."""
        try:
            response = await self._fetch_with_fallback(config)
            await self._cache.set(config.internal, response, ttl_seconds=config.ttl_seconds)
            self._snapshot(config, response)
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

        if config.primary_provider == "derived":
            result = await self._get_history_derived(config, hours)
            await self._cache.set(cache_key, result, ttl_seconds=config.ttl_seconds * 4)
            return result

        provider = self._providers.get(config.primary_provider)
        try:
            raw_points = await asyncio.wait_for(
                provider.fetch_history(config.external_primary, hours),
                timeout=self._timeout,
            )
            is_live = config.is_live
            provider_id = config.primary_provider
            # FMP only returns end-of-day bars. For intraday windows (≤ 72 h) that
            # yields at most 1–2 daily points — not enough for a line chart.
            # Treat < 2 points on an intraday window the same as no data and fall
            # back to Yahoo (hourly bars) when a fallback is configured.
            needs_intraday_fallback = len(raw_points) < 2 and hours <= 72 and config.fallback_provider
            if (not raw_points or needs_intraday_fallback) and config.fallback_provider:
                fp = self._providers.get(config.fallback_provider)
                raw_points = await asyncio.wait_for(
                    fp.fetch_history(config.external_fallback or config.external_primary, hours),
                    timeout=self._timeout,
                )
                is_live = False
                provider_id = config.fallback_provider
        except (ProviderError, TimeoutError, Exception) as e:
            logger.warning("History fetch failed for %s via %s: %s", symbol, config.primary_provider, e)
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
        await self._cache.set(cache_key, result, ttl_seconds=config.ttl_seconds * 4)
        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _enrich_live(self, response: QuoteResponse, config: SymbolConfig) -> QuoteResponse:
        """Overlay session context onto a cached/provider response."""
        if self._calendar is None:
            return response

        now_utc = datetime.now(UTC)
        state = self._calendar.get_session_state(config.exchange, now_utc)
        freshness = self._calendar.freshness_window(config.exchange)
        age = (now_utc - response.meta.fetched_at).total_seconds()
        is_fresh = age <= freshness

        if state.is_open:
            source_type = "live" if (is_fresh and response.meta.is_live) else "delayed"
            display_mode = "live"
            market_status = "open"
            next_open = None
        else:
            # Closed market + live-provider fallback means "last completed session", not "live".
            source_type = (
                response.meta.source_type
                if response.meta.source_type in {"last_session_close", "last_intraday_snapshot"}
                else "last_session_close"
            )
            display_mode = "last_completed_session"
            market_status = "closed"
            next_open = state.next_open

        return QuoteResponse(
            data=response.data,
            meta=response.meta.model_copy(update={
                "market_status": market_status,
                "display_mode": display_mode,
                "source_type": source_type,
                "as_of": response.meta.fetched_at,
                "session_date": str(state.session_date),
                "is_stale": not is_fresh,
                "stale_reason": "stale_cache" if not is_fresh else None,
                "next_market_open": next_open,
            }),
        )

    def _snapshot(self, config: SymbolConfig, response: QuoteResponse) -> None:
        """Save the latest successful quote as an intraday snapshot in the session store.

        Only stores when the market is open — live providers return 0.0% change
        when market is closed (regularMarketPrice == previousClose), which would
        corrupt correct EOD values already in the store.
        """
        if self._session_store is None:
            return
        session_date = datetime.now(UTC).date()
        if self._calendar is not None:
            now_utc = datetime.now(UTC)
            state = self._calendar.get_session_state(config.exchange, now_utc)
            if not state.is_open:
                return  # Don't overwrite correct EOD values with 0.0% live data
            session_date = state.session_date
        from ..cache.session_store import SessionCloseData
        self._session_store.store(
            config.internal,
            SessionCloseData(
                symbol=config.internal,
                price=response.data.price,
                change_pct=response.data.change_pct,
                change_value=response.data.change_value,
                as_of=response.meta.fetched_at,
                session_date=session_date,
                provider=response.meta.provider,
            ),
        )

    async def _get_history_derived(self, config: SymbolConfig, hours: int) -> HistoryResponse:
        """Compose history for derived TRY-denominated symbols (GAUTRY, GAGTRY, HAREM1KG).

        Fetches the USD base asset's history and scales each point by the current
        USD/TRY spot rate.  This is a sparkline approximation — intraday USD/TRY
        variation is not accounted for, but is acceptable for trend display.
        """
        _TROY_OZ_TO_GRAMS = 31.1035

        try:
            usdtry_quote = await self.get_quote("USD/TRY")
            usd_try = usdtry_quote.data.price
        except HTTPException:
            usd_try = 1.0  # degenerate fallback; history will show wrong scale but not crash

        if config.internal in ("GAUTRY", "HAREM1KG"):
            base_symbol = "XAU/USD"
            divisor = _TROY_OZ_TO_GRAMS
            if config.internal == "HAREM1KG":
                divisor = _TROY_OZ_TO_GRAMS / 1000  # per kg
        elif config.internal == "GAGTRY":
            base_symbol = "XAG/USD"
            divisor = _TROY_OZ_TO_GRAMS
        else:
            return HistoryResponse(
                symbol=config.internal, points=[],
                provider="derived", is_live=False, fetched_at=datetime.now(UTC),
            )

        base_config = get_symbol_config(base_symbol)
        if base_config is None:
            return HistoryResponse(
                symbol=config.internal, points=[],
                provider="derived", is_live=False, fetched_at=datetime.now(UTC),
            )

        base_provider = self._providers.get(base_config.primary_provider)
        provider_used = base_config.primary_provider
        try:
            raw_points = await asyncio.wait_for(
                base_provider.fetch_history(base_config.external_primary, hours),
                timeout=self._timeout,
            )
        except Exception as e:
            logger.warning("Derived history fetch failed for %s (base %s): %s", config.internal, base_symbol, e)
            raw_points = []

        # FMP only provides end-of-day bars — for intraday windows (≤ 72 h) it returns
        # at most 1–2 daily points which is not enough for a usable line chart.
        # Fall back to Yahoo (hourly bars) in that case.
        if len(raw_points) < 2 and base_config.fallback_provider and hours <= 72:
            try:
                fb = self._providers.get(base_config.fallback_provider)
                fallback_sym = base_config.external_fallback or base_config.external_primary
                raw_points = await asyncio.wait_for(
                    fb.fetch_history(fallback_sym, hours),
                    timeout=self._timeout,
                )
                provider_used = base_config.fallback_provider
            except Exception as e:
                logger.warning(
                    "Derived history fallback failed for %s (base %s via %s): %s",
                    config.internal, base_symbol, base_config.fallback_provider, e,
                )

        scaled = [
            HistoryPoint(time=p.time, value=round(p.value / divisor * usd_try, 4))
            for p in raw_points
        ]
        return HistoryResponse(
            symbol=config.internal,
            points=scaled,
            provider=provider_used,
            is_live=base_config.is_live,
            fetched_at=datetime.now(UTC),
        )

    async def _fetch_with_fallback(self, config: SymbolConfig) -> QuoteResponse:
        """Try primary provider, fall back if it fails, raise 503 if both fail.

        If the symbol was blocked by the startup probe (FMP 402), skip FMP
        entirely and go straight to the fallback provider.
        """
        if config.primary_provider == "derived":
            return await self._fetch_derived(config)

        # If FMP is primary but symbol is blocked, skip to fallback immediately
        use_primary = config.primary_provider
        ext_primary = config.external_primary
        if config.primary_provider == "fmp" and config.internal in self._fmp_blocked:
            if config.fallback_provider:
                use_primary = config.fallback_provider
                ext_primary = config.external_fallback or config.external_primary
                logger.debug(
                    "Skipping blocked FMP for %s, using %s directly",
                    config.internal, use_primary,
                )
            else:
                raise HTTPException(
                    status_code=503,
                    detail=f"FMP blocked for {config.internal} and no fallback configured.",
                )

        primary = self._providers.get(use_primary)

        try:
            raw = await self._fetch(primary, ext_primary)
            return self._normalize(raw, config, provider_id=use_primary, is_live=config.is_live)
        except (ProviderError, TimeoutError, Exception) as primary_err:
            logger.warning(
                "Primary provider %s failed for %s: %s",
                use_primary, config.internal, primary_err,
            )

        # If we already skipped FMP and used fallback as primary, no further fallback
        if use_primary != config.primary_provider:
            raise HTTPException(
                status_code=503,
                detail=f"Provider unavailable for {config.internal} (FMP blocked, fallback failed).",
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
        """Compute GAUTRY / HAREM1KG / GAGTRY from live sub-quotes × USD/TRY."""
        _TROY_OZ_TO_GRAMS = 31.1035

        try:
            usdtry = await self.get_quote("USD/TRY")
            usd_try_rate = usdtry.data.price
            usdtry_pct = usdtry.data.change_pct

            if config.internal in ("GAUTRY", "HAREM1KG"):
                xau = await self.get_quote("XAU/USD")
                base_price_usd = xau.data.price
                xau_pct = xau.data.change_pct
                base_change_pct = round(
                    (((1 + xau_pct / 100) * (1 + usdtry_pct / 100)) - 1) * 100,
                    4,
                )
            elif config.internal == "GAGTRY":
                xag = await self.get_quote("XAG/USD")
                base_price_usd = xag.data.price
                xag_pct = xag.data.change_pct
                base_change_pct = round(
                    (((1 + xag_pct / 100) * (1 + usdtry_pct / 100)) - 1) * 100,
                    4,
                )
            else:
                raise ProviderError("derived", config.internal, "unknown derived symbol")
        except HTTPException as e:
            raise HTTPException(
                status_code=503,
                detail=f"Cannot derive {config.internal}: sub-quote unavailable ({e.detail})",
            ) from e

        # ── Price computation ─────────────────────────────────────────────────
        gram_open: float | None = None
        if config.internal == "GAUTRY":
            # Gram Altın (TRY) = Ons Altın (USD) × USD/TRY / 31.1035
            # Pure international-spot formula — matches doviz.com standard "Gram Altın".
            # Altinkaynak is NOT used: it returns fiziksel (physical bazaar) gold
            # with a Kapalıçarşı premium of ~5% above international spot.
            price = round((base_price_usd / _TROY_OZ_TO_GRAMS) * usd_try_rate, 2)
            is_live = True   # both XAU/USD and USD/TRY sub-quotes are live
            provider_used = "derived"

            # Override change_pct: use today's session-open as reference (matches doviz.com).
            # chartPreviousClose for GC=F on Monday = Friday's close (COMEX closed weekends)
            # which produces a multi-day change. doviz.com anchors to the FIRST bar after
            # Istanbul midnight (00:00 TRT = 22:00 UTC) = COMEX session open.
            xau_open = xau.data.session_open
            try_open = usdtry.data.session_open
            if xau_open and try_open:
                gram_open = xau_open * try_open / _TROY_OZ_TO_GRAMS
                base_change_pct = round((price - gram_open) / gram_open * 100, 4)
            # else: keep compounded component change_pct baseline.

        elif config.internal == "HAREM1KG":
            price = (base_price_usd / _TROY_OZ_TO_GRAMS) * usd_try_rate * 1000
            is_live = config.is_live
            provider_used = "derived"

        else:  # GAGTRY
            price = (base_price_usd / _TROY_OZ_TO_GRAMS) * usd_try_rate
            is_live = config.is_live
            provider_used = "derived"

        if config.internal == "GAUTRY" and gram_open:
            change_value = round(price - gram_open, 4)
        elif (1 + base_change_pct / 100) != 0:
            prev_price = price / (1 + base_change_pct / 100)
            change_value = round(price - prev_price, 4)
        else:
            change_value = None
        raw = RawQuote(
            price=round(price, 2),
            change_pct=base_change_pct,
            change_value=change_value,
            fetched_at=datetime.now(UTC),
        )
        return self._normalize(raw, config, provider_id=provider_used, is_live=is_live)

    async def _fetch(self, provider: MarketProvider, symbol: str) -> RawQuote:
        return await asyncio.wait_for(
            provider.fetch_quote(symbol),
            timeout=self._timeout,
        )

    @staticmethod
    def _normalize(raw: RawQuote, config: SymbolConfig, provider_id: str, is_live: bool) -> QuoteResponse:
        return QuoteResponse(
            data=QuoteData(
                symbol=config.internal,
                name=config.name,
                price=raw.price,
                change_pct=raw.change_pct,
                change_value=getattr(raw, "change_value", None),
                open=raw.open,
                high=raw.high,
                low=raw.low,
                currency=config.currency,
                category=config.category,
                unit=config.unit,
                session_open=getattr(raw, "session_open", None),
            ),
            meta=QuoteMeta(
                provider=provider_id,
                is_live=is_live,
                delay_minutes=config.delay_minutes if not is_live else None,
                fetched_at=raw.fetched_at,
                market_status=raw.market_status,
            ),
        )


# ---------------------------------------------------------------------------
# Module-level helpers (no self needed)
# ---------------------------------------------------------------------------


def _build_closed_response(
    config: SymbolConfig,
    last_close: "SessionCloseData",
    state: "SessionState",
) -> QuoteResponse:
    """Build a QuoteResponse from a stored session close (market is closed)."""
    return QuoteResponse(
        data=QuoteData(
            symbol=config.internal,
            name=config.name,
            price=last_close.price,
            change_pct=last_close.change_pct,
            change_value=last_close.change_value,
            currency=config.currency,
            category=config.category,
            unit=config.unit,
        ),
        meta=QuoteMeta(
            provider=last_close.provider,
            is_live=False,
            delay_minutes=None,
            fetched_at=last_close.as_of,
            market_status="closed",
            display_mode="last_completed_session",
            source_type="last_session_close",
            as_of=last_close.as_of,
            session_date=str(last_close.session_date),
            is_stale=False,
            stale_reason=None,
            next_market_open=state.next_open,
        ),
    )


def _build_from_resolved(config: SymbolConfig, resolved: "ResolvedPrice") -> QuoteResponse:
    """Build a QuoteResponse from a FallbackPriceResolver result."""
    market_status = "open" if resolved.display_mode == "live" else "closed"
    next_open = None if resolved.display_mode == "live" else resolved.next_market_open
    return QuoteResponse(
        data=QuoteData(
            symbol=config.internal,
            name=config.name,
            price=resolved.price,
            change_pct=resolved.change_pct,
            change_value=resolved.change_value,
            currency=config.currency,
            category=config.category,
            unit=config.unit,
        ),
        meta=QuoteMeta(
            provider=resolved.provider,
            is_live=(resolved.display_mode == "live"),
            delay_minutes=None,
            fetched_at=resolved.as_of,
            market_status=market_status,
            display_mode=resolved.display_mode,
            source_type=resolved.source_type,
            as_of=resolved.as_of,
            session_date=str(resolved.session_date),
            is_stale=resolved.is_stale,
            stale_reason=resolved.stale_reason,
            next_market_open=next_open,
        ),
    )
