"""
EODFetcher — fetches end-of-day (session close) prices and stores them.

Called in two situations:
  1. Proactive: RefreshService detects a market-close transition and triggers
     a batch EOD fetch for all symbols on that exchange.
  2. Reactive (cold-start): FallbackPriceResolver triggers a lazy on-demand
     fetch when a closed-market request arrives with no stored session close.

Strategy per symbol type:
  - FMP-backed symbols  → FMP /stable/historical-price-eod/light (daily bars)
  - Yahoo-backed symbols → yahoo fetch_quote; uses RawQuote.previous_close
  - Coingecko-backed    → coingecko fetch_quote; uses RawQuote.previous_close
  - Derived (GAUTRY …) → composed from already-stored XAU/USD + USD/TRY closes
  - Scrapers (harem_altin, altinkaynak_gold) → stale MemoryCache entry
"""
from __future__ import annotations

import asyncio
import logging
from datetime import UTC, date, datetime

from ..cache.memory import MemoryCache
from ..cache.session_store import SessionCloseData, SessionCloseStore
from ..providers.registry import ProviderRegistry
from ..symbols.registry import SYMBOL_REGISTRY, SymbolConfig

logger = logging.getLogger(__name__)

_TROY_OZ_TO_GRAMS = 31.1035
_EOD_TIMEOUT = 10.0  # seconds


def _parse_date(s: str) -> date:
    """Parse 'YYYY-MM-DD' (or longer ISO strings) from FMP history records."""
    return date.fromisoformat(s[:10])


class EODFetcher:
    def __init__(
        self,
        providers: ProviderRegistry,
        session_store: SessionCloseStore,
        cache: MemoryCache,
    ) -> None:
        self._providers = providers
        self._session_store = session_store
        self._cache = cache

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def fetch_and_store(
        self, symbol: str, config: SymbolConfig
    ) -> SessionCloseData | None:
        """Fetch the last session close for *symbol* and persist in the store.

        Returns the stored data on success, None on failure (errors are logged
        but not re-raised — the caller degrades gracefully).
        """
        try:
            data = await self._fetch_eod(symbol, config)
            if data is not None:
                self._session_store.store(symbol, data)
                logger.debug("EOD stored for %s: %.4f (%+.2f%%)", symbol, data.price, data.change_pct)
            return data
        except Exception as exc:
            logger.warning("EOD fetch failed for %s: %s", symbol, exc)
            return None

    async def fetch_many(self, symbols: list[str]) -> None:
        """Concurrently fetch EOD for all given symbols (best-effort)."""
        tasks = []
        for sym in symbols:
            config = SYMBOL_REGISTRY.get(sym)
            if config is not None:
                tasks.append(self.fetch_and_store(sym, config))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    # ------------------------------------------------------------------
    # Internal dispatch
    # ------------------------------------------------------------------

    async def _fetch_eod(self, symbol: str, config: SymbolConfig) -> SessionCloseData | None:
        if config.primary_provider == "derived":
            return await self._fetch_derived_eod(symbol, config)
        if config.primary_provider == "fmp":
            return await self._fetch_fmp_eod(config)
        if config.primary_provider in ("yahoo", "coingecko"):
            return await self._fetch_quote_eod(config)
        # Scrapers (harem_altin, altinkaynak_gold): no reliable EOD source
        return await self._fetch_from_stale_cache(symbol)

    # ------------------------------------------------------------------
    # FMP — use daily EOD history bars
    # ------------------------------------------------------------------

    async def _fetch_fmp_eod(self, config: SymbolConfig) -> SessionCloseData | None:
        provider = self._providers.get("fmp")
        raw_points = await asyncio.wait_for(
            provider.fetch_history(config.external_primary, hours=96),
            timeout=_EOD_TIMEOUT,
        )
        if not raw_points:
            # Try fallback provider if one exists
            if config.fallback_provider and config.fallback_provider != "fmp":
                return await self._fetch_quote_eod(config, use_fallback=True)
            return None

        last = raw_points[-1]   # chronological; last = most recent bar
        prev = raw_points[-2] if len(raw_points) >= 2 else None

        price = float(last.value)
        prev_price = float(prev.value) if prev else price
        change_value = round(price - prev_price, 6)
        change_pct = round((change_value / prev_price) * 100, 4) if prev_price else 0.0
        session_date = _parse_date(last.time)

        return SessionCloseData(
            symbol=config.internal,
            price=price,
            change_pct=change_pct,
            change_value=change_value,
            as_of=datetime.combine(session_date, datetime.min.time(), tzinfo=UTC),
            session_date=session_date,
            provider="fmp",
        )

    # ------------------------------------------------------------------
    # Yahoo / CoinGecko — use fetch_quote + previous_close from RawQuote
    # ------------------------------------------------------------------

    async def _fetch_quote_eod(
        self, config: SymbolConfig, *, use_fallback: bool = False
    ) -> SessionCloseData | None:
        provider_id = config.fallback_provider if use_fallback else config.primary_provider
        if provider_id is None:
            return None

        ext_sym = (
            (config.external_fallback or config.external_primary)
            if use_fallback
            else config.external_primary
        )

        provider = self._providers.get(provider_id)
        raw = await asyncio.wait_for(
            provider.fetch_quote(ext_sym),
            timeout=_EOD_TIMEOUT,
        )

        price = raw.price
        prev_close = getattr(raw, "previous_close", None)

        if prev_close and prev_close > 0:
            change_value: float | None = round(price - prev_close, 6)
            change_pct = round((change_value / prev_close) * 100, 4)
        else:
            change_value = None
            change_pct = raw.change_pct

        return SessionCloseData(
            symbol=config.internal,
            price=price,
            change_pct=change_pct,
            change_value=change_value,
            as_of=raw.fetched_at,
            session_date=raw.fetched_at.astimezone(UTC).date(),
            provider=provider_id,
        )

    # ------------------------------------------------------------------
    # Scrapers — best-effort from stale MemoryCache
    # ------------------------------------------------------------------

    async def _fetch_from_stale_cache(self, symbol: str) -> SessionCloseData | None:
        stale = await self._cache.get_stale(symbol)
        if stale is None:
            return None

        change_value = getattr(stale.data, "change_value", None)
        return SessionCloseData(
            symbol=symbol,
            price=stale.data.price,
            change_pct=stale.data.change_pct,
            change_value=change_value,
            as_of=stale.meta.fetched_at,
            session_date=stale.meta.fetched_at.astimezone(UTC).date(),
            provider=stale.meta.provider,
        )

    # ------------------------------------------------------------------
    # Derived symbols — compose from stored sub-symbol closes
    # ------------------------------------------------------------------

    async def _fetch_derived_eod(self, symbol: str, config: SymbolConfig) -> SessionCloseData | None:
        if symbol in ("GAUTRY", "HAREM1KG"):
            return await self._fetch_gold_try_eod(symbol)
        if symbol == "GAGTRY":
            return await self._fetch_silver_try_eod()
        return None

    async def _fetch_gold_try_eod(self, symbol: str) -> SessionCloseData | None:
        # Ensure sub-components are in session store (fetch on-demand if needed)
        xau_close = await self._ensure_close("XAU/USD")
        usdtry_close = await self._ensure_close("USD/TRY")

        if xau_close is None or usdtry_close is None:
            return None

        factor = 1000 if symbol == "HAREM1KG" else 1
        price = round((xau_close.price / _TROY_OZ_TO_GRAMS) * usdtry_close.price * factor, 2)
        change_pct = round(xau_close.change_pct + usdtry_close.change_pct, 4)
        change_value: float | None = round(price * change_pct / 100, 4) if price else None

        session_date = max(xau_close.session_date, usdtry_close.session_date)
        return SessionCloseData(
            symbol=symbol,
            price=price,
            change_pct=change_pct,
            change_value=change_value,
            as_of=datetime.now(UTC),
            session_date=session_date,
            provider="derived",
        )

    async def _fetch_silver_try_eod(self) -> SessionCloseData | None:
        xag_close = await self._ensure_close("XAG/USD")
        usdtry_close = await self._ensure_close("USD/TRY")

        if xag_close is None or usdtry_close is None:
            return None

        price = round((xag_close.price / _TROY_OZ_TO_GRAMS) * usdtry_close.price, 4)
        change_pct = round(xag_close.change_pct + usdtry_close.change_pct, 4)
        change_value: float | None = round(price * change_pct / 100, 4) if price else None

        session_date = max(xag_close.session_date, usdtry_close.session_date)
        return SessionCloseData(
            symbol="GAGTRY",
            price=price,
            change_pct=change_pct,
            change_value=change_value,
            as_of=datetime.now(UTC),
            session_date=session_date,
            provider="derived",
        )

    async def _ensure_close(self, symbol: str) -> SessionCloseData | None:
        """Return stored session close, triggering an EOD fetch if not yet available."""
        stored = self._session_store.get(symbol)
        if stored is not None:
            return stored
        config = SYMBOL_REGISTRY.get(symbol)
        if config is None:
            return None
        return await self.fetch_and_store(symbol, config)
