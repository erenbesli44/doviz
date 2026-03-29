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
    exchange: str = "UNKNOWN"  # exchange calendar id: BIST|NYSE|XETRA|LSE|TSE|COMEX|NYMEX|FOREX|CRYPTO


# ---------------------------------------------------------------------------
# Registry
# Every instrument the app serves is defined here. Add new instruments by
# adding a new entry — no code changes elsewhere required.
# ---------------------------------------------------------------------------

SYMBOL_REGISTRY: dict[str, SymbolConfig] = {
    # ── Forex ───────────────────────────────────────────────────────────────
    # FMP Starter supports major TRY crosses and major USD pairs (validated live).
    # Keep Yahoo as fallback because its symbol coverage is broad and resilient.
    "USD/TRY": SymbolConfig(
        internal="USD/TRY", name="Dolar/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="USDTRY", external_fallback="USDTRY=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "EUR/TRY": SymbolConfig(
        internal="EUR/TRY", name="Euro/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="EURTRY", external_fallback="EURTRY=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "GBP/TRY": SymbolConfig(
        internal="GBP/TRY", name="Sterlin/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="GBPTRY", external_fallback="GBPTRY=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "EUR/USD": SymbolConfig(
        internal="EUR/USD", name="Euro/Dolar", category="fx",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="EURUSD", external_fallback="EURUSD=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "GBP/USD": SymbolConfig(
        internal="GBP/USD", name="Sterlin/Dolar", category="fx",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="GBPUSD", external_fallback="GBPUSD=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "CHF/TRY": SymbolConfig(
        internal="CHF/TRY", name="İsviçre Frangı/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="CHFTRY", external_fallback="CHFTRY=X",
        ttl_seconds=30, exchange="FOREX",
    ),
    "JPY/TRY": SymbolConfig(
        internal="JPY/TRY", name="Yen/TL", category="fx",
        currency="TRY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="JPYTRY", external_fallback="JPYTRY=X",
        ttl_seconds=30, exchange="FOREX",
    ),

    # ── Crypto ──────────────────────────────────────────────────────────────
    # CoinGecko: free, no key, real-time. Yahoo BTC-USD as fallback.
    "BTC/USD": SymbolConfig(
        internal="BTC/USD", name="Bitcoin", category="crypto",
        currency="USD", unit=None,
        primary_provider="coingecko", fallback_provider="yahoo",
        external_primary="bitcoin", external_fallback="BTC-USD",
        ttl_seconds=60, exchange="CRYPTO",
    ),

    # ── Gold & Silver ────────────────────────────────────────────────────────
    # FMP XAUUSD / XAGUSD are primary (spot-style symbols), Yahoo futures fallback.
    "XAU/USD": SymbolConfig(
        internal="XAU/USD", name="Ons Altın", category="gold",
        currency="USD", unit="troy oz",
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="XAUUSD", external_fallback="GC=F",
        ttl_seconds=60, exchange="COMEX",
    ),
    "XAG/USD": SymbolConfig(
        internal="XAG/USD", name="Gümüş", category="commodity",
        currency="USD", unit="troy oz",
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="XAGUSD", external_fallback="SI=F",
        ttl_seconds=60, exchange="COMEX",
    ),

    # ── Derived gold in TRY ──────────────────────────────────────────────────
    # Gram Altın (TRY) = Ons Altın (USD) × USD/TRY / 31.1035
    # Altinkaynak is intentionally NOT used here: it returns fiziksel (physical)
    # bazaar gold which carries a Kapalıçarşı premium. doviz.com's standard
    # "Gram Altın" is the pure spot-derived price from international XAU/USD.
    "GAUTRY": SymbolConfig(
        internal="GAUTRY", name="Gram Altın", category="gold",
        currency="TRY", unit="gram",
        primary_provider="derived", fallback_provider=None,
        external_primary="",  # no provider symbol: computed from XAU/USD × USD/TRY / 31.1035
        external_fallback=None,
        ttl_seconds=60, exchange="COMEX",  # follows gold futures calendar
    ),
    "HAREM1KG": SymbolConfig(
        internal="HAREM1KG", name="Harem Altın 1kg", category="gold",
        currency="TRY", unit="kg",
        primary_provider="derived", fallback_provider=None,
        external_primary="", external_fallback=None,
        ttl_seconds=120,
        is_live=False, exchange="BIST",  # Turkish local gold, tracks BIST hours
    ),
    "GAGTRY": SymbolConfig(
        internal="GAGTRY", name="Gram Gümüş", category="commodity",
        currency="TRY", unit="gram",
        primary_provider="derived", fallback_provider=None,
        external_primary="", external_fallback=None,
        ttl_seconds=60, exchange="COMEX",
    ),

    # ── Indices ──────────────────────────────────────────────────────────────
    # FMP Starter plan: ^GSPC, ^DJI, ^FTSE, ^N225 validated on live probes.
    # ^NDX, ^GDAXI → 402 on Starter → Yahoo primary only.
    "SPX": SymbolConfig(
        internal="SPX", name="S&P 500", category="index",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^GSPC", external_fallback="^GSPC",
        ttl_seconds=30, exchange="NYSE",
    ),
    "DJI": SymbolConfig(
        internal="DJI", name="Dow Jones", category="index",
        currency="USD", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^DJI", external_fallback="^DJI",
        ttl_seconds=30, exchange="NYSE",
    ),
    "NDX": SymbolConfig(
        internal="NDX", name="Nasdaq 100", category="index",
        currency="USD", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="^NDX", external_fallback=None,
        ttl_seconds=60, exchange="NYSE",
    ),
    "XU100": SymbolConfig(
        internal="XU100", name="BIST 100", category="index",
        currency="TRY", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="XU100.IS", external_fallback=None,
        ttl_seconds=300,
        is_live=False, delay_minutes=15, exchange="BIST",
    ),
    "DAX": SymbolConfig(
        internal="DAX", name="DAX 40", category="index",
        currency="EUR", unit=None,
        primary_provider="yahoo", fallback_provider=None,
        external_primary="^GDAXI", external_fallback=None,
        ttl_seconds=60, exchange="XETRA",
    ),
    "UKX": SymbolConfig(
        internal="UKX", name="FTSE 100", category="index",
        currency="GBP", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^FTSE", external_fallback="^FTSE",
        ttl_seconds=60, exchange="LSE",
    ),
    "N225": SymbolConfig(
        internal="N225", name="Nikkei 225", category="index",
        currency="JPY", unit=None,
        primary_provider="fmp", fallback_provider="yahoo",
        external_primary="^N225", external_fallback="^N225",
        ttl_seconds=60, exchange="TSE",
    ),

    # ── Commodities ──────────────────────────────────────────────────────────
    # FMP Starter: BZUSD (Brent) in sample but shows significant drift vs Yahoo BZ=F
    # (different settlement/contract reference). Yahoo BZ=F is more accurate → Yahoo primary.
    # CLUSD, NGUSD, HGUSD, KWUSD → 402 on Starter → Yahoo only.
    "BRENT": SymbolConfig(
        internal="BRENT", name="Brent Petrol", category="commodity",
        currency="USD", unit="barrel",
        primary_provider="yahoo", fallback_provider="fmp",
        external_primary="BZ=F", external_fallback="BZUSD",
        ttl_seconds=30, exchange="NYMEX",
    ),
    "WTI": SymbolConfig(
        internal="WTI", name="WTI Ham Petrol", category="commodity",
        currency="USD", unit="barrel",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="CL=F", external_fallback=None,
        ttl_seconds=60, exchange="NYMEX",
    ),
    "NATGAS": SymbolConfig(
        internal="NATGAS", name="Doğal Gaz", category="commodity",
        currency="USD", unit="MMBtu",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="NG=F", external_fallback=None,
        ttl_seconds=60, exchange="NYMEX",
    ),
    "HG": SymbolConfig(
        internal="HG", name="Bakır", category="commodity",
        currency="USD", unit="lb",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="HG=F", external_fallback=None,
        ttl_seconds=60, exchange="COMEX",
    ),
    "ZW": SymbolConfig(
        internal="ZW", name="Buğday", category="commodity",
        currency="USD", unit="bushel",
        primary_provider="yahoo", fallback_provider=None,
        external_primary="ZW=F", external_fallback=None,
        ttl_seconds=60, exchange="COMEX",  # CBOT (CME Group) — similar calendar
    ),
}


def get_symbol_config(symbol: str) -> SymbolConfig | None:
    """Look up a symbol config. Accepts 'USD/TRY' or path-safe 'USD-TRY' form."""
    normalized = symbol.upper().replace("-", "/")
    return SYMBOL_REGISTRY.get(normalized)


def symbols_by_category(category: str) -> list[SymbolConfig]:
    return [c for c in SYMBOL_REGISTRY.values() if c.category == category]
