"""Multi-guest channels (OI-018).

Mesele Ekonomi, Integral Forextv and NCM Investment TR host different guests,
so they are sources, not experts. The tracker attributes each of their views to
the participant who said it (`person_name` on the opinion entry, set only once
the video's participants were detected). A view from these channels without a
speaker is never shown.
"""

MULTI_GUEST_CHANNEL_SLUGS = frozenset({"mesele-ekonomi", "integral-forextv", "ncm-investment-tr"})


def is_multi_guest(channel_slug: str | None) -> bool:
    return (channel_slug or "").lower() in MULTI_GUEST_CHANNEL_SLUGS


def speaker_of(group: dict, entry: dict) -> str | None:
    """Who said this view: the tracker's speaker, else (single-host channels) the channel.

    Returns None for an unattributed view on a multi-guest channel: drop it.
    """
    person = str(entry.get("person_name") or "").strip() or None
    if group.get("multi_guest") or is_multi_guest(group.get("channel_slug")):
        return person
    return person or str(group.get("person_name") or group.get("channel_name") or "") or None
