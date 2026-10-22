"""Pass-through of the tracker's per-mention instrument outlook.

`outlook` is the speaker's forward-looking price direction for the instrument
(up / down / flat / none); `outlook_explicit` is True only when that direction
is the speaker's stated main scenario. None means "not classified yet".
"""

from typing import Any

_VALID = {"up", "down", "flat", "none"}


def outlook_fields(entry: dict[str, Any]) -> dict[str, Any]:
    raw = str(entry.get("outlook") or "").strip().lower()
    outlook = raw if raw in _VALID else None
    return {
        "outlook": outlook,
        "outlook_explicit": bool(entry.get("outlook_explicit")) if outlook else None,
        "outlook_horizon": entry.get("outlook_horizon") or None,
        "outlook_quote": entry.get("outlook_quote") or None,
    }
