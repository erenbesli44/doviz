"""
SessionCloseStore — in-memory store for last-known session close prices.

There is no TTL: a session close is valid until replaced by a fresher one.
This store survives across market hours within a process but is cleared on
restart. For multi-instance deployments swap the backing dict for Redis.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class SessionCloseData:
    symbol: str
    price: float
    change_pct: float
    change_value: float | None   # absolute price change from prev close; None if unavailable
    as_of: datetime              # tz-aware UTC timestamp of this close
    session_date: date           # calendar date of the trading session
    provider: str                # which provider supplied the data


class SessionCloseStore:
    """Thin in-memory dict mapping symbol → SessionCloseData with no expiry."""

    def __init__(self) -> None:
        self._store: dict[str, SessionCloseData] = {}

    def get(self, symbol: str) -> SessionCloseData | None:
        return self._store.get(symbol)

    def store(self, symbol: str, data: SessionCloseData) -> None:
        self._store[symbol] = data

    def all(self) -> dict[str, SessionCloseData]:
        return dict(self._store)

    def __len__(self) -> int:
        return len(self._store)

    def __contains__(self, symbol: str) -> bool:
        return symbol in self._store
