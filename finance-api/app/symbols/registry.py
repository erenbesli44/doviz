"""
Symbol registry — the single source of truth for every instrument the API serves.

Maps an internal symbol (used in API paths and responses) to:
  - display name and category
  - which provider to use as primary and fallback
  - provider-specific symbols (can differ from internal ones)
  - TTL for caching (shorter for live FX, longer for delayed / scraped sources)
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class SymbolConfig:
    internal: str              # canonical API symbol, e.g. "USD/TRY"
    name: str                  # display name, e.g. "Dolar/TL"
    category: str              # "fx" | "gold" | "index" | "commodity" | "crypto"
    currency: str              # quote currency, e.g. "TRY" or "USD"
    unit: str | None           # "troy oz", "gram", "barrel"; None for fx/index/crypto
    primary_provider: str      # provider id string, matches MarketProvider.provider_id
    fallback_provider: str | None
    external_primary: str      # symbol as the primary provider expects it
    external_fallback: str | None
    ttl_seconds: int           # how long to cache a successful response
    is_live: bool = True       # False = source is structurally delayed (e.g. Yahoo BIST)
    delay_minutes: int | None = None


# ---------------------------------------------------------------------------
# Registry
# Every instrument the app serves is defined here. Add new instruments by
# adding a new entry — no code changes elsewhere required.
# ---------------------------------------------------------------------------

SYMBOL_REGISTRY: dict[str, SymbolConfig] = {
    # ── Forex ───────────────────────────────────────────────────────────────
    # Yahoo Finance is the only free real-time source for TRY crosses.
    # FMP /stable/quote 402s for all TRY pairs on the free plan → no useful fallback.
    # EUR/USD and GBP/USD work on both Yahoo and FMP → FMP kept as fallback.
    "USD/TRY": SymbolConfig(
        internal="USD/TRY", name="Dolar/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="USDTRY=X", external_fallback=None,
        ttl_seconds=30,
    ),
    "EUR/TRY": SymbolConfig(
        internal="EUR/TRY", name="Euro/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="EURTRY=X", external_fallback=None,
        ttl_seconds=30,
    ),
    "GBP/TRY": SymbolConfig(
        internal="GBP/TRY", name="Sterlin/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="GBPTRY=X", external_fallback=None,
        ttl_seconds=30,
    ),
    "EUR/USD": SymbolConfig(
        internal="EUR/USD", name="Euro/Dolar", category="fx",
        currency="USD", unit=None,
        primary_provider="yahoo", fallback_provider="fmp",
        external_primary="EURUSD=X", external_fallback="EURUSD",
        ttl_seconds=30,
    ),
    "GBP/USD": SymbolConfig(
        internal="GBP/USD", name="Sterlin/Dolar", category="fx",
        currency="USD", unit=None,
        primary_provider="yahoo", fallback_provider="fmp",
        external_primary="GBPUSD=X", external_fallback="GBPUSD",
        ttl_seconds=30,
    ),
    "CHF/TRY": SymbolConfig(
        internal="CHF/TRY", name="İsviçre Frangı/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="CHFTRY=X", external_fallback=None,
        ttl_seconds=30,
    ),
    "JPY/TRY": SymbolConfig(
        internal="JPY/TRY", name="Yen/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="JPYTRY=X", external_fallback=None,
        ttl_seconds=30,
    ),

    # ── Crypto ──────────────────────────────────────────────────────────────
    # CoinGecko: free, no key, real-time. Yahoo BTC-USD as fallback.
    "BTC/USD": SymbolConfig(
        internal="BTC/USD", name="Bitcoin", category="crypto",
        currency="USD", unit=None,
        primary_provider="coingecko", fallback_provider="yahoo",
        external_primary="bitcoin", external_fallback="BTC-USD",
        ttl_seconds=60,
    ),

    # ── Gold & Silver ────────────────────────────────────────────────────────
    # Yahoo GC=F / SI=F futures are live and free.
    # FMP GCUSD / SIUSD available on free plan as fallback.
    "XAU/USD": SymbolConfig(
        internal="XAU/USD", name="Ons Altın", category="gold",
        currency="USD", unit="troy oz",
        primary_provider="yahoo", fallback_provider="fmp",
        external_primary="GC=F", external_fallback="GCUSD",
        ttl_seconds=60,
    ),
    "XAG/USD": SymbolConfig(
        internal="XAG/USD", name="Gümüş", category="commodity",
        currency="USD", unit="troy oz",
        primary_provider="yahoo", fallback_provider="fmp",
        external_primary="SI=F", external_fallback="SIUSD",
        ttl_seconds=60,
    ),

    # ── Derived gold in TRY ──────────────────────────────────────────────────
    "GAUTRY": SymbolConfig(
        internal="GAUTRY", name="Gram Altın", category="gold",
        currency="TRY", unit="gram",
        primary_provider="derived", fallback_provider=None,
        external_primary="", external_fallback=None,
        ttl_seconds=60,
    ),
    "HAREM1KG": SymbolConfig(
        internal="HAREM1KG", name="Harem Altın 1kg", category="gold",
        currency="TRY", unit="kg",
        primary_provider="derived", fallback_provider=None,
        external_primary="", external_fallback=None,
        ttl_seconds=120,
        is_live=False,
    ),

    # ── Indices ──────────────────────────────────────────────────────────────
    # FMP free plan covers: ^GSPC, ^DJI, ^FTSE, ^N225 → FMP primary, Yahoo fallback
    # FMP 402 for: ^NDX, ^GDAXI → Yahoo primary only
    "SPX": SymbolConfig(
        internal="SPX", name="S&P 500", category="index",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^GSPC", external_fallback="^GSPC",
        ttl_seconds=300,  # FMP free: ~15-min delayed at source; refresh every 5 min
    ),
    "DJI": SymbolConfig(
        internal="DJI", name="Dow Jones", category="index",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^DJI", external_fallback="^DJI",
        ttl_seconds=300,  # FMP free: ~15-min delayed at source; refresh every 5 min
    ),
    "NDX": SymbolConfig(
        internal="NDX", name="Nasdaq 100", category="index",
        currency="USD", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="^NDX", external_fallback=None,
        ttl_seconds=60,
    ),
    "XU100": SymbolConfig(
        internal="XU100", name="BIST 100", category="index",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="XU100.IS", external_fallback=None,
        ttl_seconds=300,
        is_live=False, delay_minutes=15,
    ),
    "DAX": SymbolConfig(
        internal="DAX", name="DAX 40", category="index",
        currency="EUR", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="^GDAXI", external_fallback=None,
        ttl_seconds=60,
    ),
    "UKX": SymbolConfig(
        internal="UKX", name="FTSE 100", category="index",
        currency="GBP", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^FTSE", external_fallback="^FTSE",
        ttl_seconds=300,  # FMP free: ~15-min delayed at source; refresh every 5 min
    ),
    "N225": SymbolConfig(
        internal="N225", name="Nikkei 225", category="index",
        currency="JPY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^N225", external_fallback="^N225",
        ttl_seconds=300,  # FMP free: ~15-min delayed at source; refresh every 5 min
    ),

    # ── Commodities ──────────────────────────────────────────────────────────
    # FMP free: BZUSD (Brent) ✓ → FMP primary, Yahoo fallback
    # FMP 402: CLUSD, NGUSD, HGUSD, KWUSD → Yahoo only (futures tickers)
    "BRENT": SymbolConfig(
        internal="BRENT", name="Brent Petrol", category="commodity",
        currency="USD", unit="barrel",
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="BZUSD", external_fallback="BZ=F",
        ttl_seconds=300,  # FMP free: ~15-min delayed at source; refresh every 5 min
    ),
    "WTI": SymbolConfig(
        internal="WTI", name="WTI Ham Petrol", category="commodity",
        currency="USD", unit="barrel",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="CL=F", external_fallback=None,
        ttl_seconds=60,
    ),
    "NATGAS": SymbolConfig(
        internal="NATGAS", name="Doğal Gaz", category="commodity",
        currency="USD", unit="MMBtu",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="NG=F", external_fallback=None,
        ttl_seconds=60,
    ),
    "HG": SymbolConfig(
        internal="HG", name="Bakır", category="commodity",
        currency="USD", unit="lb",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="HG=F", external_fallback=None,
        ttl_seconds=60,
    ),
    "ZW": SymbolConfig(
        internal="ZW", name="Buğday", category="commodity",
        currency="USD", unit="bushel",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="ZW=F", external_fallback=None,
        ttl_seconds=60,
    ),
}


def get_symbol_config(symbol: str) -> SymbolConfig | None:
    """Look up a symbol config. Accepts 'USD/TRY' or path-safe 'USD-TRY' form."""
    normalized = symbol.upper().replace("-", "/")
    return SYMBOL_REGISTRY.get(normalized)


def symbols_by_category(category: str) -> list[SymbolConfig]:
    return [c for c in SYMBOL_REGISTRY.values() if c.category == category]
