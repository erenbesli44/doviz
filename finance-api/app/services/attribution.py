"""Interim guest attribution for multi-guest channels (OI-018).

Mesele Ekonomi, Integral Forextv and NCM Investment TR host different guests,
so a view in their videos belongs to the guest, not the channel. Until the
tracker records participants per video, a view from these channels is kept
only when the title names exactly one guest and that guest is a person the
tracker knows. That guest becomes the speaker; everything else is dropped.
"""

import re
from collections.abc import Awaitable, Callable
from typing import Any

MULTI_GUEST_CHANNEL_SLUGS = frozenset({"mesele-ekonomi", "integral-forextv", "ncm-investment-tr"})

_NAME_SEPARATORS = re.compile(r"\s*(?:&|,|\+|\bve\b)\s*")


def is_multi_guest(channel_slug: str | None) -> bool:
    return (channel_slug or "").lower() in MULTI_GUEST_CHANNEL_SLUGS


def normalize_name(name: str) -> str:
    """Turkish-aware casefold: 'ATİLLA YEŞİLADA' == 'Atilla Yeşilada'."""
    lowered = name.replace("I", "ı").replace("İ", "i").lower()
    return " ".join(lowered.split())


def title_participants(title: str | None) -> list[str]:
    """Names after the last '|' in a title like 'Konu | Ad Soyad & Ad Soyad'."""
    if not title or "|" not in title:
        return []
    tail = title.rsplit("|", 1)[1]
    return [part.strip() for part in _NAME_SEPARATORS.split(tail) if part.strip()]


def single_known_guest(title: str | None, known: dict[str, str]) -> str | None:
    """The one guest named in the title, if the tracker knows them; else None."""
    names = title_participants(title)
    if len(names) != 1:
        return None
    return known.get(normalize_name(names[0]))


async def load_known_persons(get: Callable[[str], Awaitable[Any]]) -> dict[str, str]:
    """Map normalized name -> display name from tracker GET /persons/.

    Fails closed: on any error no guest is known, so multi-guest views are hidden.
    """
    try:
        data = await get("/persons/")
    except Exception:
        return {}
    known: dict[str, str] = {}
    for item in data if isinstance(data, list) else []:
        name = str((item or {}).get("name") or "").strip()
        if name:
            known[normalize_name(name)] = name
    return known
