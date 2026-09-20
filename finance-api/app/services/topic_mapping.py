"""
Asset taxonomy and tracker-slug mapping.

Each entry maps a public asset key (used in URLs and the consensus API) to:
- tracker_slug:  the internal slug used by tracker's `/topics/{slug}/opinions`
- asset_code:    short canonical code (BTC, USDTRY, BIST100, …) for analytics
- display_name:  human label rendered in the UI
- group:         coarse category for filtering/grouping
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Asset:
    public_key: str
    tracker_slug: str
    asset_code: str
    display_name: str
    group: str  # crypto | fx | index | commodity | macro


_ASSETS: tuple[Asset, ...] = (
    Asset("bitcoin",       "kripto-paralar",        "BTC",       "Bitcoin",                "crypto"),
    Asset("dolar-tl",      "doviz-kur",             "USDTRY",    "USD/TRY",                "fx"),
    Asset("bist",          "bist-turk-piyasalari",  "BIST100",   "BIST 100",               "index"),
    Asset("us-markets",    "amerikan-piyasalari",   "USMKT",     "ABD Borsaları",          "index"),
    Asset("altin",         "altin",                 "GOLD",      "Altın",                  "commodity"),
    Asset("gumus",         "gumus",                 "SILVER",    "Gümüş",                  "commodity"),
    Asset("petrol-enerji", "petrol-enerji",         "OIL",       "Petrol & Enerji",        "commodity"),
    Asset("faiz",          "faiz-para-politikasi",  "RATES",     "Faiz / Para Politikası", "macro"),
    Asset("enflasyon",     "enflasyon",             "INFLATION", "Enflasyon",              "macro"),
    Asset("jeopolitik",    "jeopolitik",            "GEO",       "Jeopolitik",             "macro"),
    Asset("ic-siyaset",    "ic-siyaset",            "POLITICS",  "İç Siyaset",             "macro"),
)

ASSET_BY_PUBLIC_KEY: dict[str, Asset] = {a.public_key: a for a in _ASSETS}
_BY_TRACKER_SLUG: dict[str, Asset] = {a.tracker_slug: a for a in _ASSETS}

# Legacy aliases — public keys callers might use that aren't the canonical form.
_ALIASES: dict[str, str] = {
    "kripto": "bitcoin",
    "crypto": "bitcoin",
    "usd-try": "dolar-tl",
    "bist100": "bist",
    "amerikan-piyasalari": "us-markets",
}


def all_assets() -> list[Asset]:
    return list(_ASSETS)


def resolve_public_key(key: str) -> str:
    normalized = key.strip().lower()
    return _ALIASES.get(normalized, normalized)


def to_tracker_topic_slug(topic_key: str) -> str:
    normalized = resolve_public_key(topic_key)
    asset = ASSET_BY_PUBLIC_KEY.get(normalized)
    return asset.tracker_slug if asset else normalized


def to_public_topic_key(topic_slug: str) -> str:
    asset = _BY_TRACKER_SLUG.get(topic_slug.strip().lower())
    return asset.public_key if asset else topic_slug
